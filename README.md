jquery-image-uploader
=========

jquery-image-uploader is a jquery plugin to upload file. 
It supports drap&drop and file API.
The plugin has a automatic "fallback" mode.


## Usage
### Basic usage
```js
$('#dropZone').imageUploader({
	fileField: '#files',
	url: 'ajaxUpload.php',
	afterUpload: function (data) {
		console.log(data);
	}, 
    error: function(msg) {
        alert(msg);
    }
});
```

### Possible options (with default values)
```js
$('#dropZone').imageUploader({
	fileField: null, // the "simple" file input
    hideFileField: true, // hide the file field to show only the drop zone
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
    onDragLeave: function() { return false; },
    onDragEnter: function() { return false; },
    onDragOver: function() { return false; },
    onDrop: function() { return false; },
    onUploadProgress: function(event) { return false; },
    beforeUpload: function() { return true; },
    afterUpload: function() { return false; },
    error: function(msg) { alert(msg); },
});
```
