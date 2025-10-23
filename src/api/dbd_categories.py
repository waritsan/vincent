"""
DBD News Categories Configuration
Maps category IDs to their names and metadata
"""

DBD_CATEGORIES = {
    'press-release': {
        'id': '1656067670544',
        'name': 'ข่าวประชาสัมพันธ์',
        'name_en': 'Press Release',
        'url': 'https://www.dbd.go.th/news/1656067670544/list',
        'tags': ['ข่าวประชาสัมพันธ์', 'DBD']
    },
    'activities': {
        'id': '1674707577070',
        'name': 'กิจกรรม',
        'name_en': 'Activities',
        'url': 'https://www.dbd.go.th/news/1674707577070/list',
        'tags': ['กิจกรรม', 'DBD']
    }
}

# Reverse mapping: category ID to key
CATEGORY_ID_TO_KEY = {
    cat['id']: key 
    for key, cat in DBD_CATEGORIES.items()
}
