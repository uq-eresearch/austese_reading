<?php

$workId = arg(1);
?>
<div id="alerts"></div>

<div id="metadata" data-workid="<?php print $workId; ?>"></div>
<h1 data-bind="text: workTitle"></h1>
<div class="row">
<div class="span6">
<div class="btn-group">
  <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
    Select Version
    <span class="caret"></span>
  </a>
  <ul class="dropdown-menu" data-bind="foreach: versions">
    <!-- dropdown menu links -->
    <li>
        <a href="#" data-bind="click: $parent.selectVersion">
            <span data-bind="text: displayName"></span>
        </a>
    </li>
  </ul>
</div>
<div data-bind="with: activeVersion">
    <p><b data-bind="text: displayName"></b></p>
    <ul data-bind="foreach: transcriptions">
        <li>
            <b>Transcription: </b><a href="#" data-bind="click: displayTranscription">
                <span data-bind="text: filename"></span>
            </a>
        </li>
    </ul>
    <ul data-bind="foreach: artefacts">
        <li>
            <b>Facsimiles: </b>
            <ul data-bind="foreach: facsimiles">
                <li>
                    <a href="#" data-bind="click: $parent.displayArtefact">
                        <span data-bind="text: filename"></span>
                    </a>
                </li>
            </ul>
        </li>
    </ul>
</div>
</div>

<!--
<h2>Versions</h2>
<ul data-bind="foreach: versions">
    <li>
        <b>Version: </b><span data-bind="text: id"></span>
        <span data-bind="text: name"></span>

        <span data-bind="text: date"></span>

        <span data-bind="text: publisher"></span>
        <ul data-bind="foreach: transcriptions">
            <li>
                <b>Transcription: </b><a href="#" data-bind="click: displayTranscription">
                    <span data-bind="text: filename"></span>
                </a>
            </li>
        </ul>
        <ul data-bind="foreach: artefacts">
            <li>
                <b>Artefact: </b>
                <span data-bind="id"></span>
                <ul data-bind="foreach: facsimiles">
                    <li>
                        <a href="#" data-bind="click: $parent.displayArtefact">
                            <span data-bind="text: filename"></span>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </li> 
</ul>
-->
<div class="span6">
<h2>MVDs</h2>
<ul data-bind="foreach: mvds">
    <li>
        <span data-bind="text: name"></span>
        <a data-bind="attr: { href: tableUrl }, click: displayTable">Table View</a>
        <a data-bind="attr: { href: compareUrl}, click: displayCompare">Compare View</a>
    </li>
</ul>
</div>
</div>


<div id="readingdisplay" class="well" style="width: 1000px; height: 500px; overflow: auto; overflow-x: hidden;"></div>
