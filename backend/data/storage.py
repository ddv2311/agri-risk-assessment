"""Data storage module for agricultural risk assessment."""
import os
import json
import pandas as pd
from typing import Dict, Any, Optional
import logging
from datetime import datetime, timedelta
import sqlite3
import numpy as np

logger = logging.getLogger(__name__)

class DataStorage:
    """Manages data storage and retrieval for the application."""
    
    def __init__(self, db_path: str = 'data/agricultural_data.db'):
        """Initialize the data storage.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self._ensure_db_exists()
    
    def _ensure_db_exists(self):
        """Ensure the database and required tables exist."""
        try:
            dir_name = os.path.dirname(self.db_path)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create weather data table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS weather_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT NOT NULL,
                        location TEXT NOT NULL,
                        avg_temp REAL,
                        max_temp REAL,
                        min_temp REAL,
                        rainfall REAL,
                        humidity REAL,
                        wind_speed REAL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create market data table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS market_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT NOT NULL,
                        location TEXT NOT NULL,
                        crop TEXT NOT NULL,
                        price REAL,
                        volume REAL,
                        demand REAL,
                        supply REAL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create soil data table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS soil_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        location TEXT NOT NULL,
                        ph REAL,
                        nitrogen REAL,
                        phosphorus REAL,
                        potassium REAL,
                        organic_matter REAL,
                        moisture REAL,
                        last_updated TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error ensuring database exists: {str(e)}")
            raise
    
    def save_weather_data(self, data: pd.DataFrame, location: str):
        """Save weather data to the database.
        
        Args:
            data: Weather data DataFrame
            location: Location identifier
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                for _, row in data.iterrows():
                    conn.execute('''
                        INSERT INTO weather_data (
                            date, location, avg_temp, max_temp, min_temp,
                            rainfall, humidity, wind_speed
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        row['date'].strftime('%Y-%m-%d'),
                        location,
                        row['avg_temp'],
                        row['max_temp'],
                        row['min_temp'],
                        row['rainfall'],
                        row['humidity'],
                        row['wind_speed']
                    ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error saving weather data: {str(e)}")
            raise
    
    def save_market_data(self, data: pd.DataFrame, location: str, crop: str):
        """Save market data to the database.
        
        Args:
            data: Market data DataFrame
            location: Location identifier
            crop: Crop identifier
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                for _, row in data.iterrows():
                    conn.execute('''
                        INSERT INTO market_data (
                            date, location, crop, price, volume,
                            demand, supply
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        row['date'].strftime('%Y-%m-%d'),
                        location,
                        crop,
                        row['price'],
                        row['volume'],
                        row['demand'],
                        row['supply']
                    ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error saving market data: {str(e)}")
            raise
    
    def save_soil_data(self, data: pd.DataFrame, location: str):
        """Save soil data to the database.
        
        Args:
            data: Soil data DataFrame
            location: Location identifier
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                for _, row in data.iterrows():
                    conn.execute('''
                        INSERT INTO soil_data (
                            location, ph, nitrogen, phosphorus,
                            potassium, organic_matter, moisture
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        location,
                        row['ph'],
                        row['nitrogen'],
                        row['phosphorus'],
                        row['potassium'],
                        row['organic_matter'],
                        row['moisture']
                    ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error saving soil data: {str(e)}")
            raise
    
    def get_weather_data(self, location: str, days: int = 30) -> pd.DataFrame:
        """Retrieve weather data from the database.
        
        Args:
            location: Location identifier
            days: Number of days to look back
            
        Returns:
            DataFrame containing weather data
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = '''
                    SELECT * FROM weather_data
                    WHERE location = ?
                    AND date >= date('now', ?)
                    ORDER BY date DESC
                '''
                df = pd.read_sql_query(
                    query,
                    conn,
                    params=(location, f'-{days} days')
                )
                df['date'] = pd.to_datetime(df['date'])
                return df
                
        except Exception as e:
            logger.error(f"Error retrieving weather data: {str(e)}")
            raise
    
    def get_market_data(self, location: str, crop: str, days: int = 30) -> pd.DataFrame:
        """Retrieve market data from the database.
        
        Args:
            location: Location identifier
            crop: Crop identifier
            days: Number of days to look back
            
        Returns:
            DataFrame containing market data
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = '''
                    SELECT * FROM market_data
                    WHERE location = ?
                    AND crop = ?
                    AND date >= date('now', ?)
                    ORDER BY date DESC
                '''
                df = pd.read_sql_query(
                    query,
                    conn,
                    params=(location, crop, f'-{days} days')
                )
                df['date'] = pd.to_datetime(df['date'])
                return df
                
        except Exception as e:
            logger.error(f"Error retrieving market data: {str(e)}")
            raise
    
    def get_soil_data(self, location: str) -> pd.DataFrame:
        """Retrieve soil data from the database.
        
        Args:
            location: Location identifier
            
        Returns:
            DataFrame containing soil data
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = '''
                    SELECT * FROM soil_data
                    WHERE location = ?
                    ORDER BY last_updated DESC
                    LIMIT 1
                '''
                df = pd.read_sql_query(query, conn, params=(location,))
                return df
                
        except Exception as e:
            logger.error(f"Error retrieving soil data: {str(e)}")
            raise
    
    def get_latest_data(self, location: str, crop: str, days: int = 30) -> Dict[str, pd.DataFrame]:
        """Get the latest data for all categories.
        
        Args:
            location: Location identifier
            crop: Crop identifier
            days: Number of days to look back
            
        Returns:
            Dictionary containing DataFrames for different data types
        """
        try:
            return {
                'weather': self.get_weather_data(location, days),
                'market': self.get_market_data(location, crop, days),
                'soil': self.get_soil_data(location)
            }
            
        except Exception as e:
            logger.error(f"Error retrieving latest data: {str(e)}")
            raise
    
    def cleanup_old_data(self, days_to_keep: int = 365):
        """Remove data older than specified days.
        
        Args:
            days_to_keep: Number of days of data to keep
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Clean up weather data
                cursor.execute('''
                    DELETE FROM weather_data
                    WHERE date < date('now', ?)
                ''', (f'-{days_to_keep} days',))
                
                # Clean up market data
                cursor.execute('''
                    DELETE FROM market_data
                    WHERE date < date('now', ?)
                ''', (f'-{days_to_keep} days',))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error cleaning up old data: {str(e)}")
            raise 