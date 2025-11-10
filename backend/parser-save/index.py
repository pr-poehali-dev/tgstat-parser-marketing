import json
import os
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

class SaveParsingRequest(BaseModel):
    category: str
    channels: List[Dict[str, Any]]
    status: str = Field(default='completed')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Сохранение результатов парсинга в PostgreSQL
    Args: event с httpMethod, body (category, channels[], status)
    Returns: ID записи парсинга и статус сохранения
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        if not psycopg2:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'psycopg2 not available'})
            }
        
        body_data = json.loads(event.get('body', '{}'))
        request = SaveParsingRequest(**body_data)
        
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'DATABASE_URL not configured'})
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Создаём запись о парсинге
        cursor.execute(
            """
            INSERT INTO parsing_history 
            (category, started_at, completed_at, status, total_channels, success_count, error_count)
            VALUES (%s, NOW(), NOW(), %s, %s, %s, 0)
            RETURNING id
            """,
            (request.category, request.status, len(request.channels), len(request.channels))
        )
        
        parsing_id = cursor.fetchone()['id']
        
        # Сохраняем каналы
        saved_count = 0
        for channel in request.channels:
            cursor.execute(
                """
                INSERT INTO channels 
                (parsing_id, name, link, description, admin, category, subcategory, subscribers)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (link, parsing_id) DO NOTHING
                """,
                (
                    parsing_id,
                    channel.get('name', ''),
                    channel.get('link', ''),
                    channel.get('description', ''),
                    channel.get('admin', ''),
                    channel.get('category', ''),
                    channel.get('subcategory', ''),
                    channel.get('subscribers', 0)
                )
            )
            saved_count += cursor.rowcount
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'parsing_id': parsing_id,
                'saved_channels': saved_count,
                'total_channels': len(request.channels)
            })
        }
    
    if method == 'GET':
        if not psycopg2:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'psycopg2 not available'})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'DATABASE_URL not configured'})
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем историю парсинга
        cursor.execute(
            """
            SELECT 
                id, category, started_at, completed_at, status, 
                total_channels, success_count, error_count
            FROM parsing_history 
            ORDER BY created_at DESC 
            LIMIT 20
            """
        )
        
        history = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Преобразуем datetime в строки
        for record in history:
            if record.get('started_at'):
                record['started_at'] = record['started_at'].isoformat()
            if record.get('completed_at'):
                record['completed_at'] = record['completed_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'history': history
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
