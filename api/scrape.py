import cloudscraper
from bs4 import BeautifulSoup
import sys

def scrape():
    scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False})
    url = "https://ramenparados.com/"
    
    try:
        html = scraper.get(url, timeout=20).text
        soup = BeautifulSoup(html, 'html.parser')
        
        # print all h2 and h3
        for h in soup.find_all(['h2', 'h3'])[:10]:
            print(h.text.strip())
            
    except Exception as e:
        print("Error:", str(e))
        sys.exit(1)

if __name__ == "__main__":
    scrape()
