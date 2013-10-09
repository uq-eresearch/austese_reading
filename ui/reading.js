
(function($){

var baseUrl = jQuery('#metadata').data('baseurl');
var moduleUrl = jQuery('#metadata').data('moduleurl');
var repApi = jQuery('#metadata').data('repapipath');
var xslproc, xslproc2, xslie, xsl2ie;
// Utility functions
function getById(collection, id, fieldname) {
    if (!fieldname) fieldname = 'id';
    var contents = collection();
    for (var i = 0; i < contents.length; i++) {
        if (contents[i][fieldname]() === id) {
            return contents[i];
        }
    }
    return null;
}
function getXSL(){
    jQuery.ajax({
        url: moduleUrl + '/ui/xslt/toc.xsl',
        success: function(xsl){
            if (window.ActiveXObject) { // IE
                xslie = xsl;
            } else if (document.implementation && document.implementation.createDocument){
                xslproc=new XSLTProcessor();
                xslproc.importStylesheet(xsl);
            }
        }
    });
    
}
function getVersionByTranscriptionId(versions, transcriptionId) {
    var versions = versions();
    for (var i = 0; i < versions.length; i++) {
        var version = versions[i];
        var transcriptions = version.allTranscriptions();
        for (var j = 0; j < transcriptions.length; j++) {
            var transcription = transcriptions[j];
            if (transcription.id() === transcriptionId) {
                return [version, transcription];
            }
        }
        if (version.versions().length > 0) {
            var returnVal = getVersionByTranscriptionId(version.versions, transcriptionId);
            if (returnVal) {
                returnVal[0] = version;
                return returnVal;
            }
        }
    }
}

function getVersionByFacsimileId(versions, objId, fieldname) {
    if (!fieldname) fieldname = 'facsimiles';
    var versions = versions();
    for (var i = 0; i < versions.length; i++) {
        var version = versions[i];
        var artefacts = version.artefacts();
        for (var j = 0; j < artefacts.length; j++) {
            var artefact = artefacts[j];
            for (var k = 0; k < artefact[fieldname]().length; k++) {
                var obj = artefact[fieldname]()[k];
                if (obj.id() === objId) {
                    return version;
                }
            }
        }
    }
}


function MVD(data) {
    var self = this;
    self.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
    this.uri = ko.observable(data.uri);

    this.tableUrl = ko.computed(function() { return "/collationtools/apparatus#" + self.name(); });
    this.compareUrl = ko.computed(function() { return "/collationtools/compare#" + self.name(); });

    this.displayTable = function() {
        location.hash = '/table/' + self.name();
    };

    this.displayCompare = function() {
        location.hash = '/compare/' + self.name();
    };

}


function DigitalResource(data) {  // Resource
    var self = this;
    this.filename = ko.observable(data.filename);
    this.id = ko.observable(data.id);
    this.uri = ko.observable(data.uri);
    this.filetype = ko.observable(data.metadata.filetype);
    this.title = ko.observable(data.metadata.title);
    this.contentUrl = ko.computed(function(){
        return repApi + 'resources/' + self.id()
    });
    this.recordUrl = ko.computed(function(){
        return baseUrl + "/repository/resources/" + self.id();
    });
    this.rawContentUrl = ko.computed(function() {
         return baseUrl + "/repository/resources/" + self.id() + "/content/raw"; 
     });
    this.dataUrl = ko.computed(function() {
        return baseUrl +  "/repository/resources/" + self.id() + "/content";
    });
    this.displayTitle = ko.computed(function(){
        if (self.title()){
            return self.title();
        } else {
            return self.filename();
        }
    });
    self.transcriptionContents = null;

    this.transcriptionUrl = function() {
        return '#/transcription/' + self.id();
    }

    self.displayTranscription = function() {
        location.hash = '/transcription/' + self.id();
    };
}

function Artefact(data) {
    var self = this;
    this.facsimiles = ko.observableArray([]);
    this.id = ko.observable(data.id);
    this.uri = ko.observable(data.uri);
    this.source = ko.observable(data.source);
    
    // Load Facsimile Details
    self.loadFacsimiles = function() {
        var defers = [];
        if (!$.isArray(data.facsimiles)) {
            return defers;
        }
        for (var i = 0; i < data.facsimiles.length; i++) {
            defers.push(
                jQuery.ajax({
                    type: 'GET',
                    url: repApi + 'resources/' + data.facsimiles[i],
                    dataType: "json",
                    headers: {'Accept': 'application/json'}
                }).then(function(result){
                    var digitalResource = new DigitalResource(result);
                    self.facsimiles.push(digitalResource);
                    return digitalResource;
                })
            );
        }
        return defers;
    };
    self.sortFacsimiles = function () {
        self.artefacts.sort(function(left, right) {
            return left.filename() === right.filename() ? 0 : (left.filename() < right.filename() ? -1 : 1);
        });
        return artefact;
    };
    self.facsimileUrl = function(id) {
        return '#/facsimile/' + id;
    }
    self.displayFacsimile = function(facsimile) {
        location.hash = '/facsimile/' + facsimile.id();
    };
}

function Version(data, work) {
    var self = this;
    this.work = ko.observable(work);
    this.id = ko.observable(data.id);
    this.versionTitle = ko.observable(data.versionTitle);
    this.name = ko.observable(data.name);
    this.description = ko.observable(data.description);
    this.publisher = ko.observable(data.publisher);
    this.date = ko.observable(data.date);
    this.artefacts = ko.observableArray([]);
    this.versions = ko.observableArray([]);
    this.transcriptions = ko.observableArray([]);
    var versionIds = data.versions || [];
    this.versionIds = ko.observableArray(versionIds);
   
    this.allTranscriptions = ko.computed(function(){
        var transcriptions = [];
        
        $.each(self.versions(), function() {
            if (this instanceof Version) {
                $.each(this.allTranscriptions(), function() {
                    transcriptions.push(this);
                });
            }
        });
        $.each(self.transcriptions(), function(){
            transcriptions.push(this);
        })
        
        //console.log("get all transcriptions for " + self.name() ,self.versions(), transcriptions)
        return transcriptions;
    });
    this.uri = ko.computed(function(){
        return baseUrl + '/repository/versions/' + self.id();
    });
    this.displayName = ko.computed(function() {
        return self.versionTitle() +
        (self.name()? " (" + self.name() + ")" : "" )
        + " " + self.publisher() + " " + self.date();
    });

    this.dropdownDisplayName = function() {
        var res = '';
        if (this.work() && this.work().readingVersion() && this.work().readingVersion() == this.id()) {
          res = '* ';
        }
        res += this.displayName();
        return res;
    }


    // Load Transcriptions
    this.loadTranscriptions = function() {
        var defers = [];
        for (var i = 0; i < data.transcriptions.length; i++) {
            defers.push(
                jQuery.ajax({
                    type: 'GET',
                    url: repApi + 'resources/' + data.transcriptions[i],
                    dataType: "json",
                    headers: {'Accept': 'application/json'}
                }).then(function(result){
                    var transcription = new DigitalResource(result);
                    self.transcriptions.push(transcription);
                    return transcription;
                })
            );
        }
        return $.when.apply($, defers);
    };

    // Load Artefacts
    this.loadArtefacts = function() {
        var defers = [];
        for (var i = 0; i < data.artefacts.length; i++) {
            defers.push(
                jQuery.ajax({
                    type: 'GET',
                    url: repApi + 'artefacts/' + data.artefacts[i],
                    dataType: "json",
                    headers: {'Accept': 'application/json'}
                }).then(function(result){
                    var artefact = new Artefact(result);
                    self.artefacts.push(artefact);
                    return artefact;
                })
            );
        }

        return $.when.apply($, defers);
    };
}
ko.observableArray.fn.setAt = function(index, value) {
    this.valueWillMutate();
    this()[index] = value;
    this.valueHasMutated();
}
var app = null;
function WorkModel(workId) {
    var self = this;
    // Data Fields from DB
    self.workId = workId;
    self.workTitle = ko.observable();
    self.name = ko.observable();
    self.updated = ko.observable();
    self.versions =  ko.observableArray([]);
    self.mvds = ko.observableArray([]);
    self.readingVersion = ko.observable();
    self.versionCount = ko.computed(function() {return self.versions().length;});
    self.selectedVersion = ko.observable(self.readingVersion());
    self.selectedMvd = ko.observable();
    
    // Local page state
    self.activeVersion = ko.observable();
    self.annotationsOn = ko.observable();

    self.annotationsOn(true);

    // Local actions
    self.toggleAnnotations = function() {
        var state = self.annotationsOn();
        self.annotationsOn(!state);
    };
    self.selectVersion = function(work) {
        location.hash = '/version/' + work.selectedVersion();
    };
    self.getTranscriptions = function() {
        var transcriptions = [];
        $.each(workModel.versions(), function() {
            $.each(this.allTranscriptions(), function() {
                transcriptions.push(this);
            });
        });
        return transcriptions;
    };

    self.enableAnnotations = function() {
        if (self.annotationsOn() && typeof enableAnnotationsOnElement == 'function') {
            $('#readingdisplay').waitForImages(function(){
                $('#readingdisplay').find('[data-id]').each(function(i, el){
                  enableAnnotationsOnElement($(el));
                });
            });
        }
    };

    self.disableAnnotations = function() {
        if (typeof $('#readingdisplay').find('[data-id]').removeAnnotator == 'function'){
            $('#readingdisplay').find('[data-id]').removeAnnotator();
        }
        $('#readingdisplay').find('[data-id]').annotationsEnabled = false;
    };

    self.annotationsOn.subscribe(function (annotationsEnabled) {
        if (annotationsEnabled) {
            self.enableAnnotations();
        } else {
            self.disableAnnotations();
        }
    });

    // Load MVDs
    function loadMVDs(transcriptionId) {
        var mvdLoaded = [],
            transcriptions = workModel.getTranscriptions();
        // Clear current
        workModel.mvds([]);

        jQuery.ajax({
            type: 'GET',
            url: repApi + 'mvds/?query=' + transcriptionId,
            dataType: "json",
            headers: {'Accept': 'application/json'}
        }).then(function(mvdData) {
            if (mvdData){
                $.each(mvdData.results, function() {
                    if (getById(workModel.mvds, this.id) == null) {
                        workModel.mvds.push(new MVD(this));
                    }
                });
            }
        })
    }

    function loadVersion(versionId, parent, index) {
        var versionUrl = repApi + 'versions/' + versionId;
        var loadedVersion;
        var allDone = jQuery.getJSON(versionUrl).then(function(versionData) {
            loadedVersion = new Version(versionData, parent);
            parent.versions.setAt(index, loadedVersion);
            return loadedVersion;
        }).then(function (version) {
            return $.when(version.loadTranscriptions(), version.loadArtefacts());
        }).then(function (transcription, artefact) {
            if (transcription) {
                //console.log('Transcription', transcription);
            }
            if (artefact) {
                if (artefact.loadFacsimiles)
                    artefact.loadFacsimiles();
                else if ($.isArray(artefact)) {
                    $.each(artefact, function() {
                        this.loadFacsimiles();
                    });
                }
            }
            return null;
        }).then(function () {
            var added = [];
            for (var i = 0; i < loadedVersion.versionIds().length; i++) {
                var newVer = loadVersion(loadedVersion.versionIds()[i], loadedVersion, i);
                added.push(newVer);
            }
            return added;
        });
        return allDone;
    }

    // Load initial state
    jQuery.getJSON(repApi + 'works/' + self.workId, function(workData) {
        self.workTitle(workData.workTitle);
        self.name(workData.name);
        self.updated(workData.updated);
        self.readingVersion(workData.readingVersion);

        var versionLoadResponses = [];
        for (var i = 0; i < workData.versions.length; i++) {
            versionLoadResponses.push(loadVersion(workData.versions[i], self, i));
        };



        var whenAllVersionsLoaded = $.when.apply($, versionLoadResponses);

        whenAllVersionsLoaded.done(function everythingLoaded() {
            // Setup all of the Sammy action routing

            // Client-side routes
            app = $.sammy(function() {
                
                this.get('#/version/:version', function() {
                    var version = getById(self.versions, this.params.version);
                    self.activeVersion(version);
                    var transcriptions = version.allTranscriptions();
                    if (transcriptions.length > 0){
                        transcriptions[0].displayTranscription();
                    } else {
                        this.trigger('beforeDocLoaded');
                        $('#readingdisplay').empty();
                        app.trigger('docLoaded');
                    } 
                    
                });

                this.get(/\#\/table\/(.*)/, function() {
                    var mvdName = this.params.splat[0];

                    var mvd = getById(self.mvds, mvdName, 'name');

                    this.trigger('beforeDocLoaded');
                    jQuery('#readingdisplay').html(
                        '<iframe id="mvdTable" src="'+mvd.tableUrl()+'" width="100%" height="100%"/>'
                    );
                    $('#mvdTable').on("load",function(){
                        // load in fullscreen mode
                        var windowjQuery = $('#mvdTable')[0].contentWindow.jQuery;
                        var m = $('#mvdTable').contents().find('#metadata');
                        windowjQuery.data(m[0], 'fullscreen', true)
                        
                    });
                });


                this.get(/\#\/compare\/(.*)/, function() {
                    var mvdName = this.params.splat[0];

                    var mvd = getById(self.mvds, mvdName, 'name');

                    this.trigger('beforeDocLoaded');
                    jQuery('#readingdisplay').html(
                        '<iframe id="mvdCompare" src="'+mvd.compareUrl()+'" width="100%" height="100%"/>'
                    );
                    $('#mvdCompare').on("load",function(){
                        // load in fullscreen mode
                        var windowjQuery = $('#mvdCompare')[0].contentWindow.jQuery;
                        var m = $('#mvdCompare').contents().find('#metadata');
                        windowjQuery.data(m[0], 'fullscreen', true)
                        
                    });
                });

                this.get('#/facsimile/:facsimileId', function() {
                    var facsimileId = this.params.facsimileId;
                    var imageUrl = repApi + "resources/" + facsimileId;
                    var resourceBase = baseUrl + '/repository/resources/';
                    var dataId = resourceBase + facsimileId + '/content';

                    this.trigger('beforeDocLoaded');

                    
                    var imgDiv = $('<div data-id="' + dataId + '"></div>').html($("<img class='thumbnail'></img>").attr("src", imageUrl));
                    $('#readingdisplay').html(imgDiv);

                    app.trigger('docLoaded');
                    

                    if (!self.activeVersion()) {
                        var version = getVersionByFacsimileId(self.versions, facsimileId);
                        self.activeVersion(version);
                    }
                });

                this.get('#/transcription/:transcriptionId', function() {
                    var transcriptionId = this.params.transcriptionId;
                    var results = getVersionByTranscriptionId(self.versions, transcriptionId);
                    if (results && results.length > 0) {
                        var version = results[0];
                        var transcription = results[1];
                    } else {
                        console.log("ABORT ABORT: no such transcription yet");
                        return;
                    }


                    this.trigger('beforeDocLoaded');
                    $('#readingdisplay').html('<b>Loading transcription...');
                    if (!transcription.transcriptionContents) {
                        // generate table of contents
                        // get master list of all versions and parts
                        // console.log("displaying transcription for " + transcription.filetype(), workModel, transcription);
                       
                        jQuery.ajax({
                           url: transcription.contentUrl(),
                           cache: false,
                           headers: {
                                   'Accept': 'application/xml,text/xml, text/plain;'
                           },
                           success: function(xml){
                               var result;
                               try{
                                   if (transcription.filetype().match("xml")){
                                       if (xslie){
                                           result = xml.transformNode(xslie);
                                       } else if (xslproc){
                                           // console.log("transforming",xml)
                                           xslproc.setParameter(null, "transcriptionId", transcription.id());
                                           xslproc.setParameter(null, "transcriptionUrl", transcription.dataUrl());
                                           result = xslproc.transformToFragment(xml,document);
                                       }
                                   } else {
                                       // TODO add transcription parts to toc
                                       result = "<div data-id='" + transcription.dataUrl() + "' class='span9 well white-well transcript'><pre>" + xml + "</pre></div>";
                                   }
                                   $('#readingdisplay').html(result).promise().done(function(){
                                        try{
                                            var versionmenu = $('[versionid="' + version.id() + '"] > ul').clone();
                                            $('#readingdisplay .span3').append(versionmenu);
                                            // ensure table of contents remains visible
                                            $('#readingdisplay').scroll(function(){
                                                $("#toc").css("marginTop", ($('#readingdisplay').scrollTop()) + "px");
                                            });

                                        } catch (e){
                                            console.log("problem",e)
                                        }
                                      
                                   });

                               } catch (e){
                                   console.log(e)
                               }
                               transcription.transcriptionContents = $('readingdisplay').html();
                               app.trigger('docLoaded');
                           }
                         });
                    } else {
                        console.log(transcription.transcriptionContents);
                        $('#readingdisplay').html(transcription.transcriptionContents);
                        app.trigger('docLoaded');
                    }

                    if (!self.activeVersion()) {
                        self.activeVersion(version);
                    }

                    loadMVDs(transcriptionId);
                });

                this.bind('beforeDocLoaded', function() {
                    self.disableAnnotations();
                });
                this.bind('docLoaded', function() {
                    $('.toclink').on('click',function(){
                        //console.log("go to " + $(this).data('target'))
                        var target = $('#' + $(this).data('target'));
                        var container = $('#readingdisplay');
                        container.animate({
                            scrollTop: target.offset().top - container.offset().top + container.scrollTop()
                        })
                    })
                    self.enableAnnotations();
                });

            });
            app.run();
        });
    });
} // finish WorkModel


// var workModel;
jQuery(document).ready(function(){
    getXSL();
    var workId = jQuery('#metadata').data('workid');
    workModel = new WorkModel(workId);
    ko.applyBindings(workModel);
    if (typeof enableAnnotationsOnElement != 'function'){
        jQuery('.annotationToggle').hide();
    }
});
}(jQuery))
