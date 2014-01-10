jquery-image-uploader
=========

jquery-image-uploader is a jquery plugin to upload file. 
It supports drag&drop and file API.
The plugin has a automatic "fallback" mode.

This plugin is not really production-ready.

## Installation
```sh
bower install jquery-image-uploader
```
Or copy the ```src/jquery-image-uploader.min.js``` file on your server.

## Usage
### Basic usage
```js
$('#dropZone').imageUploader({
	fileField: '#files',
	urlField: '#url',
	url: 'ajaxUpload.php',
	afterUpload: function (data) {
		console.log(data);
	}, 
    error: function(msg) {
        alert(msg);
    }
});
```

If you drag and drop an image on the "dropZone" or if you use the classic file button, it will call the url, with the file as an argument.
If you specify a url in the "urlField" field, it will call the url with a POST['url'] attribute containing the image url.

### Possible options (with default values)
```js
$('#dropZone').imageUploader({
	fileField: null, // the "simple" file input
	urlField: null, // a field which accept an "url", and trigger the upload
	urlFieldSubmit: null, // the submit button for urlField. If null, the urlField gets a "onChange" event

    hideFileField: true, // hide the file field to show only the drop zone
    hideUrlField: true, // hide the url field to show only the drop zone

	url: 'ajaxUpload.php', // the url called for ajax upload

	thumbnails: { // thumbnails options. Set to "false" to hide thumbnails
		div: null, // thumbnails div (ex: "$('#thumbnailsDiv')"), do not set to generate it
		width: null, // thumbnail width, null = image width
		height: null, // thumbnail height, null = image height
        crop: null // null|zoom|fit : null does not crop the image, zoom or fit crop if "width" and "height" are set
	},

    maxFileSize: 0, // an error is thrown if the file is bigger than max. 0 means no validation
    allowDuplicate: false, // set to true to allow multiple upload of a file

    // all callbacks. The most importants are 'afterUpload' and 'error'
    onFilesSelected: function() { return false; },
    onDragLeave: function(event) { return false; },
    onDragEnter: function(event) { return false; },
    onDragOver: function(event) { return false; },
    onDrop: function(event) { return false; },
    onUploadProgress: function(event) { return false; },
    beforeUpload: function() { return true; },
    afterUpload: function() { return false; },
    error: function(msg) { alert(msg); },
    thumbnailReady: $.noop // if you want to change the thumbnail action
});
```

### Advange usage
You can acces the ImageUploader object by getting the ```imageUploader``` data attribute.
You can then interact on the object itself.

#### Example
```js
var imgUrl = 'http://octodex.github.com/images/original.png';
$('#dropZone').data('imageUploader').addFileByUrl(imgUrl);
```
