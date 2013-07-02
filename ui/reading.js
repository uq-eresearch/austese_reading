
var $ = jQuery;

var baseUrl = '/sites/all/modules/austese_repository/api/';

// Utility functions
getById = function(collection, id) {
    var contents = collection();
    for (var i = 0; i < contents.length; i++) {
        if (contents[i].id() === id) {
            return contents[i];
        }
    }
    return null;
}

function getVersionByArtefactId(versions, artefactId) {
    var versions = versions();
    for (var i = 0; i < versions.length; i++) {
        var version = versions[i];
        var artefacts = version.artefacts()
        for (var j = 0; j < artefacts.length; j++) {
            if (artefacts[j].id() == artefactId) {
                return version;
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
        jQuery('#readingdisplay').html(
        '<iframe src="'+self.tableUrl()+'" width="1000" height="490"/>'
        );
    }

    this.displayCompare = function() {
        jQuery('#readingdisplay').html(
        '<iframe src="'+self.compareUrl()+'" width="1000" height="490"/>'
        );
    }

}


function Transcription(data) {  // Resource
    var self = this;
    this.filename = ko.observable(data.filename);
    this.id = ko.observable(data.id);
    this.uri = ko.observable(data.uri);
    this.contentUrl = ko.computed(function() { return "/repository/resources/" + self.id() + "/content/raw"; });

    self.transcriptionContents = null;


    // Load MVDs
    jQuery.ajax({
        type: 'GET',
        url: baseUrl + 'mvds/?q=' + data.id,
        dataType: "json",
        headers: {'Accept': 'application/json'},
        success: function(mvdData){
            for (var i = 0; i < mvdData.results.length; i++) {
                if (getById(workModel.mvds, mvdData.results[i].id) == null) {
                    workModel.mvds.push(new MVD(mvdData.results[i]));
                }
            }
        }
    });

    self.displayTranscription = function() {
        jQuery('#readingdisplay').html('<b>Loading transcription...');
        if (!self.transcriptionContents) {
            jQuery.get(self.contentUrl(), function(data) {
                self.transcriptionContents = data;
                jQuery('#readingdisplay').html(data);

            });
        } else {
            jQuery('#readingdisplay').html(self.transcriptionContents);
        }
    }
}

function updateAnnotations(element) {

    jQuery('#readingdisplay').removeAnnotator().data('id', dataId);
    jQuery('#readingdisplay').annotationsEnabled = false;
    console.log("enable anno on compare body", bodyEl)
    enableAnnotationsOnElement(bodyEl);
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
                    var transcription = new Transcription(result)
                    self.facsimiles.push(transcription);
                    return transcription;
                })
            );
        }
        return defers;
    }

    self.displayArtefact = function(artefact) {
        location.hash = '/artefact/' + artefact.id();
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
                    var transcription = new Transcription(result)
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
                        return artefact.loadFacsimiles();
                    }
                    return null;
                })
            );
        };
        var defer = $.when.apply($, versionLoadResponses);
        defer.done(function allVersionsLoaded() {
            console.log('all versions loaded');

            // Client-side routes    
            Sammy(function() {
                this.get('#/version/:version', function() {
                    var version = getById(self.versions, this.params.version);
                    self.activeVersion(version);
                    version.transcriptions()[0].displayTranscription();
                });

                this.get(/\#\/mvd\/(.*)/, function() {
                    var mvdId = this.params['splat'];
                });

                this.get('#/artefact/:artefactId', function() {
                    var artefactId = this.params.artefactId;
                    var imageUrl = baseUrl + "resources/" + artefactId;
                    var resourceBase = 'http://localhost/repository/resources/';
                    var dataId = resourceBase + artefactId + '/content';

                    jQuery('#readingdisplay').removeAnnotator().data('id', dataId);
                    jQuery('#readingdisplay').annotationsEnabled = false;

                    jQuery('#readingdisplay').attr('data-id', dataId);
                    jQuery('#readingdisplay').html(jQuery("<img>").attr("src", imageUrl));

                    enableAnnotationsOnElement(jQuery('#readingdisplay'));

                    var version = getVersionByArtefactId(self.versions, artefactId)
                    self.activeVersion(version);

                });

                // Do nothing when first loading
                this.get("", function() {});
            }).run();
        });
    });




}


var workModel;
jQuery(document).ready(function(){
    var workId = jQuery('#metadata').data('workid');
    workModel = new WorkModel(workId);
    ko.applyBindings(workModel);
});
