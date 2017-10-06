const http = require('http');
const cheerio = require('cheerio');
const nihonshuList = require('./nihonshuList');
const jsonfile = require('jsonfile');

function main() {
  nihonshuList.forEach((el, index) => {

    setTimeout(function() {

      request(el.pid, (result) => {
        jsonfile.writeFile('./nihonshu.json', result, {flag: 'a', spaces: 2}, function(err) {
          // console.error(err)
          console.log(el.pid + ': done!');
        });
  
      });

    }, 3000 * index)
    
  })
}

/**
 * 등급분류 : 다이긴죠(大吟釀)
 * 알콜함량 : 15%, 일본주도 : ±0
 * 산 도 : 1.3, 정미율 : 50%
 * 규 격 : 720ml X 6BTL
 * 제조사 : 朝日酒造 아사히주조
 * 지역(원산지) : 니이가타
 * 수입유통 : (주)니혼슈코리아
 * 판매여부 : 구입가능
 */
const PROS = {
  '등급분류': 'type',
  '알콜함량': 'alcohol',
  '일본주도': 'nihonShudo',
  '산 도': 'acidity',
  '정미율': 'ricePolishingRate',
  // '규 격': 'Volume',
  '제조사': 'company',
  '지역(원산지)': 'local',
  '수입유통': 'importation',
  '판매여부': 'sales',
};

function getProp(str) {
  const property = str.split(' : ');
  if (property[0] === '규 격') {
    const index = property[1].indexOf('ml');
    return {
      volume: property[1].slice(0, index + 2)
    }
  } else {
    return {
      [PROS[property[0]]] : property[1]
    }
  }
}

function request(pid, callback) {

  http.get(`http://www.nihonshu.co.kr/product_view.asp?pid=${pid}`, res => {

    let body;
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      let $ = cheerio.load(body);
      let $tagetTable = $('body table table table table table');
      // $table.find('tbody tr td[align="center"] img');
      let $table = $tagetTable.find('tbody tr:nth-child(2) td[align="left"]');
      let $children = $table.children();

      const kName = $children[0].children[0].data;
      const jName = $children[1].next.data.replace(/\n|\(|\)/gi, '');
      const eName = $children[2].next.data.replace('\n', '');
      let description = '';
      const descChildren = $children[3].children;
      descChildren.forEach(child => {
        if (child.type === 'text') {
          description += child.data.replace('\n', '');
        }
      });

      let sake = {
        kName,
        jName,
        eName,
        description,
      };

      const propChildren = $children[4].children;
      propChildren.forEach(child => {
        if (child.type === 'text') {
          let text = child.data;
          text = text.replace(' :\n', ' : ');
          text = text.replace(/\n/gi, '');

          const textArray = text.split(', ');
          textArray.forEach(child => {
            if (child.trim()) {
              let obj = getProp(child);
              // sake = { ...sake, obj};
              sake = Object.assign({}, sake, obj);
            }
          });
        }
      });

      // console.log(sake);
      callback(sake)
    });
  });
}

main();
