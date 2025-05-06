"""Script to manage data scrapers."""
import argparse
import logging
from scrapers.scheduler import scheduler
import time
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description='Manage agricultural data scrapers')
    parser.add_argument('action', choices=['start', 'stop', 'run_once'],
                       help='Action to perform with scrapers')
    
    args = parser.parse_args()
    
    try:
        if args.action == 'start':
            logger.info("Starting scrapers in scheduled mode...")
            scheduler.start()
            
            # Keep the script running
            try:
                while True:
                    time.sleep(60)
            except KeyboardInterrupt:
                logger.info("Stopping scrapers...")
                scheduler.stop()
                
        elif args.action == 'stop':
            logger.info("Stopping scrapers...")
            scheduler.stop()
            
        elif args.action == 'run_once':
            logger.info("Running one-time scraping...")
            # Run each scraper once
            scheduler._fetch_weather_data()
            scheduler._fetch_commodity_prices()
            scheduler._fetch_agricultural_data()
            logger.info("One-time scraping completed")
            
    except Exception as e:
        logger.error(f"Error in scraper management: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 