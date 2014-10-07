var $, Document, FIXTURE_METADATA, Util;

Util = require('../../../src/util');

Document = require('../../../src/plugin/document');

$ = Util.$;

FIXTURE_METADATA = {
    links: ['<link rel="alternate" href="foo.pdf" type="application/pdf"></link>', '<link rel="alternate" href="foo.doc" type="application/msword"></link>', '<link rel="bookmark" href="http://example.com/bookmark"></link>', '<link rel="alternate" href="es/foo.html" hreflang="es" type="text/html"></link>', '<link rel="alternate" href="feed" type="application/rss+xml"></link>', '<link rel="canonical" href="http://example.com/bookmark/canonical.html"></link>'],
    highwire: ['<meta name="citation_doi" content="10.1175/JCLI-D-11-00015.1">', '<meta name="citation_title" content="Foo">', '<meta name="citation_pdf_url" content="foo.pdf">'],
    dc: ['<meta name="dc.identifier" content="doi:10.1175/JCLI-D-11-00015.1">', '<meta name="dc.identifier" content="isbn:123456789">', '<meta name="DC.type" content="Article">'],
    facebook: ['<meta property="og:url" content="http://example.com">'],
    twitter: ['<meta name="twitter:site" content="@okfn">'],
    favicon: ['<link rel="icon" href="http://example.com/images/icon.ico"></link>'],
    eprints: ['<meta name="eprints.title" content="Computer Lib / Dream Machines">'],
    prism: ['<meta name="prism.title" content="Literary Machines">']
};

describe('Document plugin', function() {
    var metadata, tags;
    tags = null;
    metadata = null;
    describe('Document plugin', function() {
        return it('adds document metadata to the annotation onBeforeAnnotationCreated', function() {
            var annotation, plugin;
            // Document plugin doesn't use the registry, so we can pass null
            plugin = new Document.Document(null);
            annotation = {};
            plugin.onBeforeAnnotationCreated(annotation);
            return assert.property(annotation, 'document');
        });
    });
    describe('getDocumentMetadata() returned metadata', function() {
        // Add some metadata tags to the document head
        beforeEach(function() {
            var html, name, t;
            tags = [];
            for (name in FIXTURE_METADATA) {
                t = FIXTURE_METADATA[name];
                html = t.join('\n');
                tags[name] = $(html).appendTo('head');
            }
            return metadata = Document.getDocumentMetadata();
        });
        afterEach(function() {
            var $elements, _, _results;
            _results = [];
            // Remove tags from document head
            for (_ in tags) {
                $elements = tags[_];
                _results.push($elements.remove());
            }
            return _results;
        });
        it('should have links with absolute hrefs and types', function() {
            assert.ok(metadata.link);
            assert.equal(metadata.link.length, 8);
            assert.equal(metadata.link[0].href, window.location.href);
            assert.equal(metadata.link[1].rel, "alternate");
            assert.match(metadata.link[1].href, /^.+foo\.pdf$/);
            assert.equal(metadata.link[1].type, "application/pdf");
            assert.equal(metadata.link[2].rel, "alternate");
            assert.match(metadata.link[2].href, /^.+foo\.doc$/);
            assert.equal(metadata.link[2].type, "application/msword");
            assert.equal(metadata.link[3].rel, "bookmark");
            assert.equal(metadata.link[3].href, "http://example.com/bookmark");
            assert.equal(metadata.link[4].rel, "canonical");
            assert.equal(metadata.link[4].href, "http://example.com/bookmark/canonical.html");
            assert.equal(metadata.link[5].href, "doi:10.1175/JCLI-D-11-00015.1");
            assert.match(metadata.link[6].href, /.+foo\.pdf$/);
            assert.equal(metadata.link[6].type, "application/pdf");
            return assert.equal(metadata.link[7].href, "doi:10.1175/JCLI-D-11-00015.1");
        });
        it('should ignore atom and RSS feeds and alternate languages', function() {
            return assert.equal(metadata.link.length, 8);
        });
        it('should have highwire metadata', function() {
            assert.ok(metadata.highwire);
            assert.deepEqual(metadata.highwire.pdf_url, ['foo.pdf']);
            assert.deepEqual(metadata.highwire.doi, ['10.1175/JCLI-D-11-00015.1']);
            return assert.deepEqual(metadata.highwire.title, ['Foo']);
        });
        it('should have dublincore metadata', function() {
            assert.ok(metadata.dc);
            assert.deepEqual(metadata.dc.identifier, ["doi:10.1175/JCLI-D-11-00015.1", "isbn:123456789"]);
            return assert.deepEqual(metadata.dc.type, ["Article"]);
        });
        it('should have facebook metadata', function() {
            assert.ok(metadata.facebook);
            return assert.deepEqual(metadata.facebook.url, ["http://example.com"]);
        });
        it('should have eprints metadata', function() {
            assert.ok(metadata.eprints);
            return assert.deepEqual(metadata.eprints.title, ['Computer Lib / Dream Machines']);
        });
        it('should have prism metadata', function() {
            assert.ok(metadata.prism);
            return assert.deepEqual(metadata.prism.title, ['Literary Machines']);
        });
        it('should have twitter card metadata', function() {
            assert.ok(metadata.twitter);
            return assert.deepEqual(metadata.twitter.site, ['@okfn']);
        });
        it('should have a favicon', function() {
            return assert.equal(metadata.favicon, 'http://example.com/images/icon.ico');
        });
        it('does not have empty fields for nonexistent metadata', function() {
            tags.highwire.remove();
            tags.facebook.remove();
            metadata = Document.getDocumentMetadata();
            assert.isUndefined(metadata.highwire);
            return assert.isUndefined(metadata.facebook);
        });
        it('has a title derived from metadata, in preference order', function() {
            metadata = Document.getDocumentMetadata();
            assert.strictEqual(metadata.title, 'Foo');
            tags.highwire.remove();
            metadata = Document.getDocumentMetadata();
            assert.strictEqual(metadata.title, 'Computer Lib / Dream Machines');
            tags.eprints.remove();
            metadata = Document.getDocumentMetadata();
            return assert.strictEqual(metadata.title, 'Literary Machines');
        });
        return it('falls back to using the page title in the absence of metadata', function() {
            var $elements, _;
            for (_ in tags) {
                $elements = tags[_];
                $elements.remove();
            }
            metadata = Document.getDocumentMetadata();
            return assert.strictEqual(metadata.title, document.title);
        });
    });
    return describe('absoluteUrl()', function() {
        it('should add the protocol when the url starts with two slashes', function() {
            var result;
            result = Document.absoluteUrl('//example.com/');
            return assert.equal(result, 'http://example.com/');
        });
        it('should add a trailing slash when given an empty path', function() {
            var result;
            result = Document.absoluteUrl('http://example.com');
            return assert.equal(result, 'http://example.com/');
        });
        it('should make a relative path into an absolute url', function() {
            var expected, result;
            result = Document.absoluteUrl('path');
            expected = document.location.protocol + '//' + document.location.host + document.location.pathname.replace(/[^\/]+$/, '') + 'path';
            return assert.equal(result, expected);
        });
        return it('should make an absolute path into an absolute url', function() {
            var expected, result;
            result = Document.absoluteUrl('/path');
            expected = document.location.protocol + '//' + document.location.host + '/path';
            return assert.equal(result, expected);
        });
    });
});