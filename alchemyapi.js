/**
   Copyright 2014 AlchemyAPI

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


var http = require('http');

exports = module.exports = AlchemyAPI;

// Declare a few static variables
const API_HOST     = 'access.alchemyapi.com';
const API_BASE_URL = '/calls';


function AlchemyAPI(key) {
    // Make sure the key formating looks good
    if (key.length != 40) {
        throw new Error('Invalid key. If you do not have a key, register for one at: http://www.alchemyapi.com/api/register.html');
    }

    // save the API key
    this.apikey = key;
};

/**
 * Makes the call, then converts the returned JSON string into a Javascript object.
 *
 * @param endpoint The API endpoint to call
 * @param params   The call parameters, both required and optional
 * @param sfile    A file to stream if this is a file upload (optional)
 * @param callback The callback function, which receives either an error or the response.
 */
AlchemyAPI.prototype.analyze = function analyze(endpoint, params, sfile, callback) {
    var urlKVPairs = [],
        reqParams = '',
        reqBody = '',
        upload = false;

    // Add the API key and force the output mode to JSON
    params['apikey'] = this.apikey;
    params['outputMode'] = 'json';

    // This is an upload if there is a file for streaming
    if (typeof sfile === "string") {
        params['imagePostMode'] = 'raw';
        upload = true;
    } else { // not an upload, sfile param must be the callback
        callback = sfile;
    }

    // Build the API options into the URL (for upload) or body
    Object.keys(params).forEach(function (key) {
        urlKVPairs.push(key + '=' + encodeURIComponent(params[key]));
    });
    if (upload) {
        reqParams = '?' + urlKVPairs.join('&');
    } else {
        reqBody = urlKVPairs.join('&');
    }

    // Build the HTTP request options
    var opts = {
        method: 'POST',
        hostname: API_HOST,
        path: API_BASE_URL + endpoint + reqParams,
    };
    if (upload) {
        opts['headers'] = {'Content-Length': fs.statSync(sfile).size};
    } else {
        opts['headers'] = {'Content-Length': reqBody.length};
    }

    var postReq = http.request(opts, function (res) {
        var response = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) { response += chunk; });
        res.on('end', function () {
            try {
                callback(JSON.parse(response));
            } catch (e) {
                callback({ status:'ERROR', statusInfo: e });
            }
        });
        res.on('error', function (err) {
            callback({ status:'ERROR', statusInfo: err });
        });
    });

    // Execute the call to the API
    if (upload) {
        fs.createReadStream(sfile).pipe(postReq);
    } else {
        postReq.write(reqBody);
        postReq.end();
    }
};

// Setup the endpoints
AlchemyAPI.ENDPOINTS = {
    'sentiment': {
        'url':  '/url/URLGetTextSentiment',
        'text': '/text/TextGetTextSentiment',
        'html': '/html/HTMLGetTextSentiment'
    },
    'sentiment_targeted': {
        'url':  '/url/URLGetTargetedSentiment',
        'text': '/text/TextGetTargetedSentiment',
        'html': '/html/HTMLGetTargetedSentiment'
    },
    'author': {
        'url':  '/url/URLGetAuthor',
        'html': '/html/HTMLGetAuthor'
    },
    'authors': {
        'url':  '/url/URLGetAuthors',
        'html': '/html/HTMLGetAuthors'
    },
    'keywords': {
        'url':  '/url/URLGetRankedKeywords',
        'text': '/text/TextGetRankedKeywords',
        'html': '/html/HTMLGetRankedKeywords'
    },
    'concepts': {
        'url':  '/url/URLGetRankedConcepts',
        'text': '/text/TextGetRankedConcepts',
        'html': '/html/HTMLGetRankedConcepts'
    },
    'entities': {
        'url':  '/url/URLGetRankedNamedEntities',
        'text': '/text/TextGetRankedNamedEntities',
        'html': '/html/HTMLGetRankedNamedEntities'
    },
    'category': {
        'url':  '/url/URLGetCategory',
        'text': '/text/TextGetCategory',
        'html': '/html/HTMLGetCategory'
    },
    'relations': {
        'url':  '/url/URLGetRelations',
        'text': '/text/TextGetRelations',
        'html': '/html/HTMLGetRelations'
    },
    'language': {
        'url':  '/url/URLGetLanguage',
        'text': '/text/TextGetLanguage',
        'html': '/html/HTMLGetLanguage'
    },
    'text': {
        'url':  '/url/URLGetText',
        'html': '/html/HTMLGetText'
    },
    'text_raw': {
        'url':  '/url/URLGetRawText',
        'html': '/html/HTMLGetRawText'
    },
    'title': {
        'url':  '/url/URLGetTitle',
        'html': '/html/HTMLGetTitle'
    },
    'feeds': {
        'url':  '/url/URLGetFeedLinks',
        'html': '/html/HTMLGetFeedLinks'
    },
    'microformats': {
        'url':  '/url/URLGetMicroformatData',
        'html': '/html/HTMLGetMicroformatData'
    },
    'taxonomy': {
        'url':  '/url/URLGetRankedTaxonomy',
        'text': '/text/TextGetRankedTaxonomy',
        'html': '/html/HTMLGetRankedTaxonomy'
    },
    'combined': {
        'url': '/url/URLGetCombinedData'
    },
    'image': {
        'url': '/url/URLGetImage'
    },
    'image_keywords': {
        'url':   '/url/URLGetRankedImageKeywords',
        'image': '/image/ImageGetRankedImageKeywords'
    },
    'pub_date': {
        'url':  '/url/URLGetPubDate',
        'html': '/image/HTMLGetPubDate'
    }
};


/**
 * Extracts the publication date for a URL or HTML.
 * For the docs, please refer to: http://www.alchemyapi.com/api/publication-date/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.pub_date = function pubDate(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['pub_date'])) {
        callback({ status:'ERROR', statusInfo:'Publication date extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['pub_date'][flavor], options, callback);
    }
};


/**
 * Extracts the entities for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/entity-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/entity-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      disambiguate: disambiguate entities (i.e. Apple the company vs. apple the fruit). 0: disabled, 1: enabled (default)
 *      linkedData: include linked data on disambiguated entities. 0: disabled, 1: enabled (default)
 *      coreference: resolve coreferences (i.e. the pronouns that correspond to named entities). 0: disabled, 1: enabled (default)
 *      quotations: extract quotations by entities. 0: disabled (default), 1: enabled.
 *      sentiment: analyze sentiment for each entity. 0: disabled (default), 1: enabled. Requires 1 additional API transction if enabled.
 *      showSourceText: 0: disabled (default), 1: enabled
 *      maxRetrieve: the maximum number of entities to retrieve (default: 50)
 */
AlchemyAPI.prototype.entities = function entities(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['entities'])) {
        callback({ status:'ERROR', statusInfo:'Entity extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['entities'][flavor], options, callback);
    }
};


/**
 * Extracts the keywords from text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/keyword-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/keyword-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      maxRetrieve: the max number of keywords returned (default: 50)
 *      keywordExtractMode:  normal (default), strict
 *      sentiment: analyze sentiment for each keyword. 0: disabled (default), 1: enabled. Requires 1 additional API transaction if enabled.
 *      showSourceText: 0: disabled (default), 1: enabled.
 *      sourceText: where to obtain the text that will be processed by this API call.
 */
AlchemyAPI.prototype.keywords = function keywords(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['keywords'])) {
        callback({ status:'ERROR', statusInfo:'Keyword extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['keywords'][flavor], options, callback);
    }
};


/**
 * Tags the concepts for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/concept-tagging/
 * For the docs, please refer to: http://www.alchemyapi.com/api/concept-tagging/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      maxRetrieve: the maximum number of concepts to retrieve (default: 8)
 *      linkedData: include linked data, 0: disabled, 1: enabled (default)
 *      showSourceText: 0:disabled (default), 1: enabled
 */
AlchemyAPI.prototype.concepts = function concepts(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['concepts'])) {
        callback({ status:'ERROR', statusInfo:'Concept tagging is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['concepts'][flavor], options, callback);
    }
};


/**
 * Calculates the sentiment for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/sentiment-analysis/
 * For the docs, please refer to: http://www.alchemyapi.com/api/sentiment-analysis/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      showSourceText: 0: disabled (default), 1: enabled
 */
AlchemyAPI.prototype.sentiment = function sentiment(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['sentiment'])) {
        callback({ status:'ERROR', statusInfo:'Sentiment analysis is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['sentiment'][flavor], options, callback);
    }
};


/**
 * Calculates the targeted sentiment for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/sentiment-analysis/
 * For the docs, please refer to: http://www.alchemyapi.com/api/sentiment-analysis/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      showSourceText: 0: disabled, 1: enabled
 */
AlchemyAPI.prototype.sentiment_targeted = function sentimentTargeted(flavor, data, target, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['sentiment_targeted'])) {
        callback({ status:'ERROR', statusInfo:'Sentiment analysis is not available for ' + flavor });
    } else if (!target) {
        callback({ status:'ERROR', statusInfo:'target must not be null' });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        options['target'] = target;
        this.analyze(AlchemyAPI.ENDPOINTS['sentiment_targeted'][flavor], options, callback);
    }
};


/**
 * Extracts the cleaned text (removes ads, navigation, etc.) for a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/text-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/text-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      useMetadata: utilize meta description data, 0: disabled, 1: enabled (default)
 *      extractLinks: include links, 0: disabled (default), 1: enabled.
 */
AlchemyAPI.prototype.text = function text(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['text'])) {
        callback({ status:'ERROR', statusInfo:'Text extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['text'][flavor], options, callback);
    }
};


/**
 * Extracts the raw text (includes ads, navigation, etc.) for a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/text-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/text-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.text_raw = function textRaw(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['text_raw'])) {
        callback({ status:'ERROR', statusInfo:'Text extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['text_raw'][flavor], options, callback);
    }
};


/**
 * Extracts the author from a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/author-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/author-extraction/
 *
 * @deprecated
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.author = function author(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['author'])) {
        callback({ status:'ERROR', statusInfo:'Author extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['author'][flavor], options, callback);
    }
};


/**
 * Extracts the authors from a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/authors-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/authors-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.authors = function authors(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['authors'])) {
        callback({ status:'ERROR', statusInfo:'Authors extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['authors'][flavor], options, callback);
    }
};


/**
 * Detects the language for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/api/language-detection/
 * For the docs, please refer to: http://www.alchemyapi.com/products/features/language-detection/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.language = function language(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['language'])) {
        callback({ status:'ERROR', statusInfo:'Language detection is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['language'][flavor], options, callback);
    }
};


/**
 * Extracts the title for a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/text-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/text-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      useMetadata: utilize title info embedded in meta data, 0: disabled, 1: enabled (default)
 */
AlchemyAPI.prototype.title = function title(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['title'])) {
        callback({ status:'ERROR', statusInfo:'Title extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['title'][flavor], options, callback);
    }
};


/**
 * Extracts the relations for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/relation-extraction/
 * For the docs, please refer to: http://www.alchemyapi.com/api/relation-extraction/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      sentiment: 0: disabled (default), 1: enabled. Requires one additional API transaction if enabled.
 *      keywords: extract keywords from the subject and object. 0: disabled (default), 1: enabled. Requires one additional API transaction if enabled.
 *      entities: extract entities from the subject and object. 0: disabled (default), 1: enabled. Requires one additional API transaction if enabled.
 *      requireEntities: only extract relations that have entities. 0: disabled (default), 1: enabled.
 *      sentimentExcludeEntities: exclude full entity name in sentiment analysis. 0: disabled, 1: enabled (default)
 *      disambiguate: disambiguate entities (i.e. Apple the company vs. apple the fruit). 0: disabled, 1: enabled (default)
 *      linkedData: include linked data with disambiguated entities. 0: disabled, 1: enabled (default).
 *      coreference: resolve entity coreferences. 0: disabled, 1: enabled (default)
 *      showSourceText: 0: disabled (default), 1: enabled.
 *      maxRetrieve: the maximum number of relations to extract (default: 50, max: 100)
 */
AlchemyAPI.prototype.relations = function relations(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['relations'])) {
        callback({ status:'ERROR', statusInfo:'Relation extraction is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['relations'][flavor], options, callback);
    }
};


/**
 * Categorizes the text for text, a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/text-categorization/
 * For the docs, please refer to: http://www.alchemyapi.com/api/text-categorization/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      showSourceText: 0: disabled (default), 1: enabled
 */
AlchemyAPI.prototype.category = function category(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['category'])) {
        callback({ status:'ERROR', statusInfo:'Text categorization is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['category'][flavor], options, callback);
    }
};


/**
 * Detects the RSS/ATOM feeds for a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/feed-detection/
 * For the docs, please refer to: http://www.alchemyapi.com/api/feed-detection/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.feeds = function feeds(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['feeds'])) {
        callback({ status:'ERROR', statusInfo:'Feed detection is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['feeds'][flavor], options, callback);
    }
};


/**
 * Parses the microformats for a URL or HTML.
 * For an overview, please refer to: http://www.alchemyapi.com/products/features/microformats-parsing/
 * For the docs, please refer to: http://www.alchemyapi.com/api/microformats-parsing/
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      none
 */
AlchemyAPI.prototype.microformats = function microformats(flavor, data, options, callback) {
    options = options || {}

    if (!(flavor in AlchemyAPI.ENDPOINTS['microformats'])) {
        callback({ status:'ERROR', statusInfo:'Microformats parsing is not available for ' + flavor });
    } else {
        //Add the data to the options and analyze
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['microformats'][flavor], options, callback);
    }
};


/**
 * Categorized through the taxonomy call for text, HTML, or a URL.
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      showSourceText: 0: disabled (default), 1: enabled.
 */
AlchemyAPI.prototype.taxonomy = function taxonomy(flavor, data, options, callback) {
    options = options || {}

    //Add the data to the options and analyze
    options[flavor] = data;
    this.analyze(AlchemyAPI.ENDPOINTS['taxonomy'][flavor], options, callback);
};


/**
 * Extracts the combined call for a URL.
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      extract: VALUE,VALUE,VALUE,... (possible VALUEs: page-image,entity,keyword,title,author,taxonomy,concept,relation,doc-sentiment)
 *      extractMode: (only applies when 'page-image' VALUE passed to 'extract' option)
 *      trust-metadata: less CPU-intensive, less accurate
 *      always-infer: more CPU-intensive, more accurate
 *      disambiguate: whether to disambiguate detected entities, 0: disabled, 1: enabled (default)
 *      linkedData: whether to include Linked Data content links with disambiguated entities, 0: disabled, 1: enabled (default). disambiguate must be enabled to use this.
 *      coreference: whether to he/she/etc coreferences into detected entities, 0: disabled, 1: enabled (default)
 *      quotations: whether to enable quotations extraction, 0: disabled (default), 1: enabled
 *      sentiment: whether to enable entity-level sentiment analysis, 0: disabled (default), 1: enabled. Requires one additional API transaction if enabled.
 *      showSourceText: 0: disabled (default), 1: enabled.
 *      maxRetrieve: maximum number of named entities to extract (default: 50)
 */
AlchemyAPI.prototype.combined = function combined(flavor, data, options, callback) {
    options = options || {}

    //Add the data to the options and analyze
    options[flavor] = data;
    this.analyze(AlchemyAPI.ENDPOINTS['combined'][flavor], options, callback);
};


/**
 * Extracts images from a URL.
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      extractMode: trust-metadata: less CPU-intensive and less accurate, always-infer: more CPU-intensive and more accurate
 */
AlchemyAPI.prototype.image = function image(flavor, data, options, callback) {
    options = options || {}

    //Add the data to the options and analyze
    options[flavor] = data;
    this.analyze(AlchemyAPI.ENDPOINTS['image'][flavor], options, callback);
};


/**
 * Tags image with keywords
 *
 * @param flavor  Which version of the call, i.e. text, url or html.
 * @param data    The data to analyze, either the text, the url or html code.
 * @param options Various parameters that can be used to adjust how the API works, see below for more info on the available options.
 * @param callback The callback function, which receives either an error or the response.
 *
 * Available Options:
 *      extractMode: trust-metadata: less CPU-intensive and less accurate, always-infer: more CPU-intensive and more accurate
 *      imagePostMode: not-raw: pass an unencoded image file with "image=URI_ENCODED_DATA"; raw: pass an unencoded image file using POST ('image' flavor only).
 */
AlchemyAPI.prototype.image_keywords = function imageKeywords(flavor, data, options, callback) {
    options = options || {}

    //Add the data to the options and analyze
    if (flavor === "image") { // if it's an image, we'll pass the image to upload
        this.analyze(AlchemyAPI.ENDPOINTS['image_keywords'][flavor], options, data, callback);
    } else {
        options[flavor] = data;
        this.analyze(AlchemyAPI.ENDPOINTS['image_keywords'][flavor], options, callback);
    }
};
