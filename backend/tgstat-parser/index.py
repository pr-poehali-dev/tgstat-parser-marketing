import json
import os
from typing import Dict, Any, List
from pydantic import BaseModel, Field

class ParseRequest(BaseModel):
    category: str = Field(..., description="Категория для парсинга")
    max_channels: int = Field(default=50, description="Максимальное количество каналов")

class Channel(BaseModel):
    name: str
    link: str
    description: str
    admin: str
    category: str
    subcategory: str
    subscribers: int

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Парсинг Telegram-каналов с TGStat.ru
    Args: event с httpMethod, body (category, max_channels)
    Returns: Список каналов в JSON или статус парсинга
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
        body_data = json.loads(event.get('body', '{}'))
        request = ParseRequest(**body_data)
        
        # Мок-данные для демонстрации
        # В реальной версии здесь будет Playwright для парсинга TGStat
        mock_channels: List[Dict] = [
            {
                'name': 'Маркетинг с нуля',
                'link': 'https://t.me/marketing_zero',
                'description': 'Практические советы по маркетингу для начинающих. Кейсы, инструменты, стратегии продвижения.',
                'admin': 'https://t.me/admin_marketing',
                'category': 'Маркетинг и PR',
                'subcategory': 'SMM',
                'subscribers': 45000
            },
            {
                'name': 'PR Daily',
                'link': 'https://t.me/pr_daily',
                'description': 'Ежедневные новости из мира PR и коммуникаций. Тренды, аналитика, инсайты.',
                'admin': 'https://t.me/pr_expert',
                'category': 'Маркетинг и PR',
                'subcategory': 'PR',
                'subscribers': 32000
            },
            {
                'name': 'Growth Hacking',
                'link': 'https://t.me/growth_hacks',
                'description': 'Лучшие тактики роста и масштабирования бизнеса. Кейсы успешных стартапов.',
                'admin': 'https://t.me/growth_admin',
                'category': 'Маркетинг и PR',
                'subcategory': 'Growth',
                'subscribers': 28000
            },
            {
                'name': 'Контент-маркетинг Pro',
                'link': 'https://t.me/content_marketing_pro',
                'description': 'Стратегии контент-маркетинга, копирайтинг, создание вирусного контента.',
                'admin': 'https://t.me/content_admin',
                'category': 'Маркетинг и PR',
                'subcategory': 'Контент',
                'subscribers': 38000
            },
            {
                'name': 'Email Marketing Hub',
                'link': 'https://t.me/email_marketing_hub',
                'description': 'Email-рассылки, автоворонки, конверсия. Практические руководства и инструменты.',
                'admin': 'https://t.me/email_expert',
                'category': 'Маркетинг и PR',
                'subcategory': 'Email',
                'subscribers': 22000
            },
            {
                'name': 'Таргетированная реклама',
                'link': 'https://t.me/target_ads',
                'description': 'Все о таргете в соцсетях: ВК, Instagram, Facebook. Кейсы и разборы кампаний.',
                'admin': 'https://t.me/target_admin',
                'category': 'Маркетинг и PR',
                'subcategory': 'SMM',
                'subscribers': 41000
            },
            {
                'name': 'Бренд-менеджмент',
                'link': 'https://t.me/brand_management',
                'description': 'Построение и развитие брендов. Позиционирование, репутация, коммуникации.',
                'admin': 'https://t.me/brand_expert',
                'category': 'Маркетинг и PR',
                'subcategory': 'Бренд',
                'subscribers': 25000
            },
            {
                'name': 'Influence Marketing',
                'link': 'https://t.me/influence_marketing',
                'description': 'Работа с инфлюенсерами и блогерами. Стратегии коллабораций и интеграций.',
                'admin': 'https://t.me/influence_admin',
                'category': 'Маркетинг и PR',
                'subcategory': 'Инфлюенс',
                'subscribers': 19000
            }
        ]
        
        limited_channels = mock_channels[:request.max_channels]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'channels': limited_channels,
                'total': len(limited_channels),
                'category': request.category
            })
        }
    
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'service': 'TGStat Parser API',
                'version': '1.0.0',
                'status': 'ready'
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
