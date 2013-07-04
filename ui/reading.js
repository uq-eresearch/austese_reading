
var $ = jQuery;

var baseUrl = '/sites/all/modules/austese_repository/api/';

// Utility functions
getById = function(collection, id, fieldname) {
    if (!fieldname) fieldname = 'id';
    var contents = collection();
    for (var i = 0; i < contents.length; i++) {
        if (contents[i][fieldname]() === id) {
            return contents[i];
        }
    }
    return null;
}

function getVersionByTranscriptionId(versions, id) {
    var versions = versions();
    for (var i = 0; i < versions.length; i++) {
        var version = versions[i];
        var transcriptions = version.transcriptions();
        for (var j = 0; j < transcriptions.length; j++) {
            var transcription = transcriptions[j];
            if (transcription.id() == id) {
                return [version, transcription];
            }
        }
    }
}

function getVersionByFacsimileId(versions, objId, fieldname) {
    if (!fieldname) fieldname = 'facsimiles';
    var versions = versions();
    for (var i = 0; i < versions.length; i++) {
        var version = versions[i];
        var artefacts = version.artefacts()
        for (var j = 0; j < artefacts.length; j++) {
            var artefact = artefacts[j];
            for (var k = 0; k < artefact[fieldname]().length; k++) {
                var obj = artefact[fieldname]()[k];
                if (obj.id() == objId) {
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
    }

    this.displayCompare = function() {
        location.hash = '/compare/' + self.name();
    }

}


function DigitalResource(data) {  // Resource
    var self = this;
    this.filename = ko.observable(data.filename);
    this.id = ko.observable(data.id);
    this.uri = ko.observable(data.uri);
    this.rawContentUrl = ko.computed(function() {
         return "/repository/resources/" + self.id() + "/content/raw"; 
     });
    this.dataUrl = ko.computed(function() {
        return window.location.origin + "/repository/resources/" + self.id() + "/content";
    })

    self.transcriptionContents = null;

    self.displayTranscription = function() {
        location.hash = '/transcription/' + self.id();
    }
}

function Artefact(data) {
    var self = this;
    this.facsimiles = ko.observableArray([]);
    this.id = ko.observable(data.id);
    this.uri = ko.observable(data.uri);

    // Load Facsimile Details
    self.loadFacsimiles = function() {
        var defers = [];
        for (var i = 0; i < data.facsimiles.length; i++) {
            defers.push(
                jQuery.ajax({
                    type: 'GET',
                    url: baseUrl + 'resources/' + data.facsimiles[i],
                    dataType: "json",
                    headers: {'Accept': 'application/json'}
                }).then(function(result){
                    var digitalResource = new DigitalResource(result)
                    self.facsimiles.push(digitalResource);
                    return digitalResource;
                })
            );
        }
        return defers;
    }
    self.sortFacsimiles = function () {
        self.artefacts.sort(function(left, right) {
            return left.filename() == right.filename() ? 0 : (left.filename() < right.filename() ? -1 : 1);
        });
        return artefact;
    };

    self.displayFacsimile = function(facsimile) {
        location.hash = '/facsimile/' + facsimile.id();
    }
}

function Version(data) {
    var self = this;
    this.id = ko.observable(data.id);
    this.versionTitle = ko.observable(data.versionTitle);
    this.description = ko.observable(data.description);
    this.publisher = ko.observable(data.publisher);
    this.date = ko.observable(data.date);
    this.artefacts = ko.observableArray([]);
    this.transcriptions = ko.observableArray([]);
    this.displayName = ko.computed(function() {
        return self.versionTitle() + " " + self.publisher() + " " + self.date();
    });


    // Load Transcriptions
    this.loadTranscriptions = function() {
        var defers = [];
        for (var i = 0; i < data.transcriptions.length; i++) {
            defers.push(
                jQuery.ajax({
                    type: 'GET',
                    url: baseUrl + 'resources/' + data.transcriptions[i],
                    dataType: "json",
                    headers: {'Accept': 'application/json'}
                }).then(function(result){
                    var transcription = new DigitalResource(result)
                    self.transcriptions.push(transcription);
                    return transcription;
                })
            );
        }
        return $.when.apply($, defers);
    }

    // Load Artefacts
    this.loadArtefacts = function() {
        var defers = [];
        for (var i = 0; i < data.artefacts.length; i++) {
            defers.push(
                jQuery.ajax({
                    type: 'GET',
                    url: baseUrl + 'artefacts/' + data.artefacts[i],
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
    }
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

    // Local page state
    self.activeVersion = ko.observable();
    self.annotationsOn = ko.observable();

    self.annotationsOn(true);

    // Local actions
    self.toggleAnnotations = function() {
        var state = self.annotationsOn();
        self.annotationsOn(!state);
    }
    self.selectVersion = function(version) {
        location.hash = '/version/' + version.id();
    }
    self.getTranscriptions = function() {
        var transcriptions = [];
        $.each(workModel.versions(), function() {
            $.each(this.transcriptions(), function() {
                transcriptions.push(this);
            })
        });
        return transcriptions;
    }

    self.enableAnnotations = function() {
        enableAnnotationsOnElement($('#readingdisplay')[0]);

    }
    self.disableAnnotations = function() {
        $('#readingdisplay').removeAnnotator();
        $('#readingdisplay')[0].annotationsEnabled = false;
    }

    self.annotationsOn.subscribe(function (annotationsEnabled) {
        if (annotationsEnabled) {
            self.enableAnnotations();
        } else {
            self.disableAnnotations();
        }
    });


    var queue = $({});

    // Load initial state
    jQuery.getJSON(baseUrl + 'works/' + self.workId, function(workData) {
        self.workTitle(workData.workTitle);
        self.name(workData.name);
        self.updated(workData.updated);

        var versionLoadResponses = [];
        for (var i = 0; i < workData.versions.length; i++) {
            var versionUrl = baseUrl + 'versions/' + workData.versions[i];
            versionLoadResponses.push(
                jQuery.getJSON(versionUrl).then(function(versionData) {
                    var version = new Version(versionData);
                    self.versions.push(version);
                    return version;
                }).then(function (version) {
                    return $.when(version.loadTranscriptions(), version.loadArtefacts());
                }).then(function (transcription, artefact) {
                    if (transcription) {
                        console.log('Transcription', transcription);
                    }
                    if (artefact) {
                        console.log('Artefact', artefact);
                        if (artefact.loadFacsimiles)
                            artefact.loadFacsimiles();
                        else if ($.isArray(artefact)) {
                            $.each(artefact, function() {
                                this.loadFacsimiles();
                            })
                        }
                    }
                    return null;
                })
            );
        };
        var defer = $.when.apply($, versionLoadResponses);
        defer.then(function() {
            var defers = [],
                transcriptions = workModel.getTranscriptions();
            $.each(transcriptions, function() {
                defers.push( 
                    jQuery.ajax({
                        type: 'GET',
                        url: baseUrl + 'mvds/?q=' + this.id(),
                        dataType: "json",
                        headers: {'Accept': 'application/json'}
                    }).then(function(mvdData) {
                        $.each(mvdData.results, function() {
                            if (getById(workModel.mvds, this.id) == null) {
                                workModel.mvds.push(new MVD(this));
                            }
                        });
                    })
                    );
            });
            return $.when.apply($, defers);
        }).done(function allVersionsLoaded() {
            console.log('all versions loaded');

            // Client-side routes
            app = $.sammy(function() {
                this.get('#/version/:version', function() {
                    var version = getById(self.versions, this.params.version);
                    self.activeVersion(version);

                    version.transcriptions()[0].displayTranscription();
                });

                this.get(/\#\/table\/(.*)/, function() {
                    var mvdName = this.params.splat[0];

                    var mvd = getById(self.mvds, mvdName, 'name');

                    this.trigger('beforeDocLoaded');
                    jQuery('#readingdisplay').html(
                        '<iframe src="'+mvd.tableUrl()+'" width="100%" height="100%"/>'
                    );
                });


                this.get(/\#\/compare\/(.*)/, function() {
                    var mvdName = this.params.splat[0];

                    var mvd = getById(self.mvds, mvdName, 'name');

                    this.trigger('beforeDocLoaded');
                    jQuery('#readingdisplay').html(
                        '<iframe src="'+mvd.compareUrl()+'" width="100%" height="100%"/>'
                    );
                });

                this.get('#/facsimile/:facsimileId', function() {
                    var facsimileId = this.params.facsimileId;
                    var imageUrl = baseUrl + "resources/" + facsimileId;
                    var resourceBase = 'http://localhost/repository/resources/';
                    var dataId = resourceBase + facsimileId + '/content';

                    this.trigger('beforeDocLoaded');

                    $('#readingdisplay').data('id', dataId).attr('data-id', dataId);
                    $('#readingdisplay').html($("<img>").attr("src", imageUrl));

                    app.trigger('docLoaded');
                    

                    if (!self.activeVersion()) {
                        var version = getVersionByFacsimileId(self.versions, facsimileId);
                        self.activeVersion(version);
                    }
                });

                this.get('#/transcription/:transcriptionId', function() {
                    var transcriptionId = this.params.transcriptionId;
                    var results = getVersionByTranscriptionId(self.versions, transcriptionId);
                    var version = results[0];
                    var transcription = results[1];

                    this.trigger('beforeDocLoaded');
                    $('#readingdisplay').html('<b>Loading transcription...');
                    if (!transcription.transcriptionContents) {
                        jQuery.get(transcription.rawContentUrl(), function(data) {
                            transcription.transcriptionContents = data;

                            $('#readingdisplay').data('id', transcription.dataUrl());
                            jQuery('#readingdisplay').html(data);
                            app.trigger('docLoaded');

                        });
                    } else {
                        $('#readingdisplay').data('id', transcription.dataUrl());
                        $('#readingdisplay').html(transcription.transcriptionContents);
                        app.trigger('docLoaded');
                    }

                    if (!self.activeVersion()) {
                        self.activeVersion(version);
                    }
                });

                this.bind('beforeDocLoaded', function() {
                    console.log('beforeDocLoaded');
                    $('#readingdisplay').removeData("id");
                    self.disableAnnotations();

                });
                this.bind('docLoaded', function() {
                    console.log('docLoaded');
                    self.enableAnnotations();
                });

                // Do nothing when first loading
                this.get("", function() {});


            });
            app.run();
        });
    });




}


var workModel;
jQuery(document).ready(function(){
    var workId = jQuery('#metadata').data('workid');
    workModel = new WorkModel(workId);
    ko.applyBindings(workModel);
});
