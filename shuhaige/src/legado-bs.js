let bs = [
  {
    "bookSourceGroup": "自制,源仓库,网页源",
    "bookSourceName": "书海阁",
    "bookSourceType": 0,
    "bookSourceUrl": "https://m.shuhaige.net",
    "bookUrlPattern": "https?://m.shuhaige.net/(shu_)?\\d+.(html)?",
    "customOrder": 0,
    "enabled": true,
    "enabledCookieJar": true,
    "enabledExplore": true,
    "exploreUrl": "全部分类::/shuku/\n玄幻::/XuanHuan/\n奇幻::/QiHuan/\n武侠::/WuXia/\n都市::/DuShi/\n历史::/LiShi/\n军事::/JunShi/\n悬疑::/XuanYi/\n游戏::/YouXi/\n科幻::/KeHuan/\n体育::/TiYu/\n古言::/GuYan/\n现言::/XianYan/\n幻言::/HuanYan/\n仙侠::/XianXia/\n青春::/QinɡChun/\n穿越::/ChuanYue/\n女生::/NuShenɡ/\n其他::/QiTa/",
    "header": "{\"User-Agent\": \"Mozilla/5.0 (Linux; Android 9) Mobile Safari/537.36\"}",
    "lastUpdateTime": 1698747342277,
    "respondTime": 180000,
    "ruleBookInfo": {
      "author": "@get:{a}",
      "coverUrl": "@get:{c}",
      "init": "@put:{n:\"[property$=book_name]@content\",\na:\"[property$=author]@content\",\nk:\"[property~=category|status|update_time]@content\",\nw:\".detail span.-1@text\",\nl:\"[property$=latest_chapter_name]@content\",\ni:\"[property$=description]@content\",\nc:\"[property$=image]@content\",\nu:\"li.now a@href\"}",
      "intro": "@get:{i}##.*观看小说:",
      "kind": "@get:{k}",
      "lastChapter": "@get:{l}",
      "name": "@get:{n}",
      "tocUrl": "@get:{u}",
      "wordCount": "@get:{w}"
    },
    "ruleContent": {
      "content": ".content p!-1@html",
      "nextContentUrl": "text.下一页@href",
      "replaceRegex": "##\\s*（本章.*）\\s*"
    },
    "ruleExplore": [],
    "ruleReview": [],
    "ruleSearch": {
      "author": "a.2@text",
      "bookList": "ul.list li",
      "bookUrl": "a.0@href",
      "checkKeyWord": "剑来",
      "coverUrl": "img@src",
      "intro": "p.intro@text",
      "kind": "span@text",
      "lastChapter": "a.-1@text",
      "name": "a.1@text"
    },
    "ruleToc": {
      "chapterList": "ul.read li a",
      "chapterName": "text",
      "chapterUrl": "href",
      "nextTocUrl": "option@value||text.下一页@href"
    },
    "searchUrl": "/search.html,{\n  \"body\": \"searchkey={{key}}\",\n  \"method\": \"POST\"\n}",
    "weight": 0
  }
]

bs = bs[0]