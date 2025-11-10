-- Создание таблицы для истории парсинга
CREATE TABLE IF NOT EXISTS parsing_history (
    id SERIAL PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    total_channels INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Создание таблицы для каналов
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    parsing_id INTEGER REFERENCES parsing_history(id),
    name VARCHAR(500) NOT NULL,
    link VARCHAR(1000) NOT NULL,
    description TEXT,
    admin VARCHAR(1000),
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    subscribers INTEGER DEFAULT 0,
    parsed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(link, parsing_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_channels_category ON channels(category);
CREATE INDEX IF NOT EXISTS idx_channels_subcategory ON channels(subcategory);
CREATE INDEX IF NOT EXISTS idx_channels_parsing_id ON channels(parsing_id);
CREATE INDEX IF NOT EXISTS idx_parsing_history_status ON parsing_history(status);
CREATE INDEX IF NOT EXISTS idx_parsing_history_created_at ON parsing_history(created_at DESC);

-- Комментарии к таблицам
COMMENT ON TABLE parsing_history IS 'История запусков парсинга';
COMMENT ON TABLE channels IS 'Собранные данные о Telegram-каналах';
