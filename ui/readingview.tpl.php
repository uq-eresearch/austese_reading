<?php
$workId = arg(1);
$baseUrl = 'http://'. $_SERVER['SERVER_NAME'];
$repApi = $baseUrl . '/' . drupal_get_path('module', 'repository') . '/api/';
$moduleUrl = 'http://' . $_SERVER['SERVER_NAME'] . '/' . drupal_get_path('module','reading');
$project = null;
if (isset($_GET['project'])) {
 $project = $_GET['project'];
}
?>
<script id="versionDisplay" type="text/html">
  <!-- ko if: $data -->
  <li data-bind="attr: { versionid: id }">
<?php /*   <span data-bind="text: displayName()" /> 
    <br> */ ?>

<?php /*    <div data-bind="foreach: artefacts">
    <!-- ko if: facsimiles().length > 0 -->
            <b data-bind="text: source"></b><b> facsimiles:</b>
            <ul data-bind="foreach: facsimiles">
                <li>
                    <a href="#" data-bind="attr: { href: $parent.facsimileUrl(id())}">
                        <span data-bind="text: filename"></span>
                    </a>
                </li>
            </ul>
    <!-- /ko -->
    </div> */ ?>
    <!-- ko if: $data.transcriptions && transcriptions().length == 1 -->
      <!-- ko with: transcriptions()[0] -->
          <a href="#" data-bind="attr: { href: transcriptionUrl()}">
              <span data-bind=" text: $parent.displayName()"></span>
          </a>
      <!-- /ko -->
    <!-- /ko -->
    <!-- ko if: $data.transcriptions && transcriptions().length > 1 -->
        <ul data-bind="foreach: transcriptions">
            <li>
                <a href="#" data-bind="attr: { href: transcriptionUrl()}">
                    <span data-bind="text: $parent.displayName()"></span>
                </a>
            </li>
        </ul>
    <!-- /ko -->
    <ul data-bind="template: { name: 'versionDisplay', foreach: versions }"></ul>
  
  </li>
  <!-- /ko -->
</script>

<div id="alerts"></div>

<div id="metadata"
 data-baseurl="<?php print $baseUrl; ?>" 
 data-moduleurl="<?php print $moduleUrl; ?>"
 data-repapipath="<?php print $repApi;?>"
 data-workid="<?php print $workId; ?>">
</div>

<a href="/repository/works/<?php print $workId; ?><?php if ($project): print '?project='.$project; endif; ?>"><h1 data-bind="text: workTitle"></h1></a>


<div class="row-fluid">

<!--  toolbar -->
<form class="well white-well form-inline">
  &nbsp;&nbsp;<b>Compare: </b>
  <select data-bind="blah: console.log($data.mvds), options: mvds, optionsText: 'name', value: selectedMvd"></select>
  <b>Version: </b>
  <!-- ko: if versions -->
  <select data-bind="
        value: selectedVersion,
        event: { change: selectVersion },
        options: versions,
        optionsText: function(item) {
          return item ? item.dropdownDisplayName() : '';
        },
        optionsValue: function(item) {
            return item ? item.id() : '';
        }"></select>
  <!-- /ko -->


  &nbsp;&nbsp;<b>Compare: </b>
  <select data-bind="options: mvds, optionsText: 'name', value: selectedMvd"></select>
  <div style="display:inline" data-bind="with: selectedMvd">
  <button data-bind="click: displayCompare" class="btn">Side By Side</button>
  <button data-bind="click: displayTable" class="btn">Table</button>
  <div data-bind="text: versions"></div>

  </div>
  
    
  <label class="annotationToggle pull-right checkbox">
    <input  data-bind="checked: annotationsOn" type="checkbox"> <a href="#" data-bind="click: toggleAnnotations">Annotations</a>
  </label>
 
  </form>
  
</div>
<div id="readingdisplay" class="well" style="height: 500px; overflow: auto;"></div>

<div class="row-fluid">

<div data-bind="with: activeVersion">
<div class="span6">
    <!--p>Displaying version <a target="_blank" data-bind="attr: { href: uri, title: description }"><b data-bind="text: displayName"></b></a></p-->
    <b>Transcriptions: </b>
    <ul data-bind="foreach: transcriptions">
        <li>
            <a href="#" data-bind="click: displayTranscription">
                Display <span data-bind="text: displayTitle"></span>
            </a>
             <a data-bind="attr: {href: recordUrl, title: displayTitle}">
                (View record)
            </a>
        </li>
    </ul>
</div>
<div class="span6">
    <div data-bind="foreach: artefacts">
    <!-- ko if: facsimiles().length > 0 -->

            <b data-bind="text: source"></b><b> facsimiles:</b>
            <ul data-bind="foreach: facsimiles">
                <li>
                    <a href="#" data-bind="click: $parent.displayFacsimile">
                        Display <span data-bind="text: filename"></span>
                    </a>
                    <a data-bind="attr: {href: recordUrl, title: displayTitle}">
                        (View record)
                    </a>
                </li>
            </ul>

        <!-- /ko -->
    </div>
   </div>
</div>
</div>


<ul style="display:none;" data-bind="template: { name: 'versionDisplay', foreach: $data.versions }"></ul>
