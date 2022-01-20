let INVALID_COMMAND = "Invalid Command - Valid Format: ?? champion position";
let VALID_COMMAND = "Valid Command - You shouldn't see this";
let VALID_CHAMPIONS_LIST = [
    'aatrox',       'ahri',         'akali',        'alistar',
    'amumu',        'anivia',       'annie',        'aphelios',
    'ashe',         'aurelion sol', 'azir',         'bard',
    'blitzcrank',   'brand',        'braum',        'caitlyn',
    'camille',      'cassiopeia',   "cho'gath",     'corki',
    'darius',       'diana',        'draven',       'dr. mundo',
    'ekko',         'elise',        'evelynn',      'ezreal',
    'fiddlesticks', 'fiora',        'fizz',         'galio',
    'gangplank',    'garen',        'gnar',         'gragas',
    'graves',       'hecarim',      'heimerdinger', 'illaoi',
    'irelia',       'ivern',        'janna',        'jarvan iv',
    'jax',          'jayce',        'jhin',         'jinx',
    "kai'sa",       'kalista',      'karma',        'karthus',
    'kassadin',     'katarina',     'kayle',        'kayn',
    'kennen',       "kha'zix",      'kindred',      'kled',
    "kog'maw",      'leblanc',      'lee sin',      'leona',
    'lillia',       'lissandra',    'lucian',       'lulu',
    'lux',          'malphite',     'malzahar',     'maokai',
    'master yi',    'miss fortune', 'wukong',       'mordekaiser',
    'morgana',      'nami',         'nasus',        'nautilus',
    'neeko',        'nidalee',      'nocturne',     'nunu & willump',
    'olaf',         'orianna',      'ornn',         'pantheon',
    'poppy',        'pyke',         'qiyana',       'quinn',
    'rakan',        'rammus',       "rek'sai",      'renekton',
    'rengar',       'riven',        'rumble',       'ryze',
    'samira',       'sejuani',      'senna',        'seraphine',
    'sett',         'shaco',        'shen',         'shyvana',
    'singed',       'sion',         'sivir',        'skarner',
    'sona',         'soraka',       'swain',        'sylas',
    'syndra',       'tahm kench',   'taliyah',      'talon',
    'taric',        'teemo',        'thresh',       'tristana',
    'trundle',      'tryndamere',   'twisted fate', 'twitch',
    'udyr',         'urgot',        'varus',        'vayne',
    'veigar',       "vel'koz",      'vi',           'viktor',
    'vladimir',     'volibear',     'warwick',      'xayah',
    'xerath',       'xin zhao',     'yasuo',        'yone',
    'yorick',       'yuumi',        'zac',          'zed',
    'ziggs',        'zilean',       'zoe',          'zyra',
    'vex',          'akshan',       'gwen',          'viego',
    'rell'
];

let VALID_POSITIONS_LIST = ['top','middle','mid','jg','jungle','adc','bot','bottom','sup','supp','support'];

module.exports = {
    INVALID_COMMAND,
    VALID_CHAMPIONS_LIST,
    VALID_POSITIONS_LIST
}