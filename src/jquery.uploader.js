/**
 * Uploader (for jQuery)
 * version: 1.0 (29/01/2012)
 * @requires jQuery v1.4.0 or later
 * @copyright 2012 Julien DENIAU
 */
if(typeof jQuery !== undefined){
	(function($){
		$.fn.uploader = function(params){
			// =============================== 
			// Settings 
			// =============================== 
			var options = $.extend({}, {
				dropZone: $(this),
				fileField: null,
				url: null,

				showThumbnails : false,
				thumbnails : {
					div: null,
					width: null,
					height: null
				},

				maxFileSize: 0,
				progressBar: null,
				
				onFilesSelected: function() { return false; },
				onDragLeave: function() { return false; },
				onDragEnter: function() { return false; },
				onDragOver: function() { return false; },
				onDrop: function() { return false; },
				onUploadProgress: function(event) { return false; },
				beforeUpload: function() { return true; },
				afterUpload: function() { return false; },
				error: function(msg) { alert(msg); }
			}, params);

			canUpload = true;
			uploadFileList = new Array();


			// =============================== 
			// Internal functions
			// =============================== 
			/**
			 * fileApiSupported check if the file api is supported
			 * 
			 * @return void
			 */
			function fileApiSupported() {
				return (window.File && window.FileReader && window.FileList);
			}

			/**
			 * onDragLeave 
			 * 
			 * @param event $event 
			 * @return void
			 */
			function onDragLeave(event) {
				event.preventDefault();
				event.stopPropagation();
				//you can remove a style from the drop zone
				return options.onDragLeave();
			}

			/**
			 * onDragEnter 
			 * 
			 * @param event $event 
			 * @return void
			 */
			function onDragEnter(event) {
				event.preventDefault();
				event.stopPropagation();
				//you can add a style to the drop zone
				return options.onDragEnter();
			}

			/**
			 * onDragOver 
			 * 
			 * @param event $event 
			 * @return void
			 */
			function onDragOver(event) {
				event.preventDefault();
				event.stopPropagation();
				event.originalEvent.dataTransfer.effectAllowed= "copy";
				event.originalEvent.dataTransfer.dropEffect = "copy";

				return options.onDragOver();
			}

			/**
			 * onDrop 
			 * 
			 * @param event $event 
			 * @return void
			 */
			function onDrop(event) {
				event.preventDefault();
				event.stopPropagation();
				console.log(event.originalEvent.dataTransfer.files);
				addFiles(event.originalEvent.dataTransfer.files);

				return options.onDrop();
			}



			var xhr = new XMLHttpRequest();

			/**
			 * onUploadProgress 
			 * 
			 * @param event $event 
			 * @return void
			 */
			function onUploadProgress(event) {
				if (event.lengthComputable) {
					console.log(event.loaded + '/' + event.total);
				}

				return options.onUploadProgress(event);
			}

			/**
			 * uploadComplete 
			 * 
			 * @return void
			 */
			function uploadComplete(event) {
				canUpload = true;
				uploadNextFile();
				return options.afterUpload(event.target.response);
			}

			/**
			 * uploadFailed 
			 * 
			 * @return void
			 */
			function uploadFailed() {
				canUpload = true;
				uploadNextFile();
				return options.error('upload failed');
			}

			/**
			 * uploadCanceled 
			 * 
			 * @return void
			 */
			function uploadCanceled() {
				canUpload = true;
				uploadNextFile();
				return options.error('upload canceled');
			}

			/**
			 * addUploadFile
			 *
			 * @param file $file
			 * @access public
			 * @return void
			 */
			function addUploadFile(file) {
				uploadFileList.push(file);
				uploadNextFile();
			}

			/**
			 * uploadNextFile
			 *
			 * @access public
			 * @return void
			 */
			function uploadNextFile() {
				if (canUpload) {
					canUpload = false;
					if (uploadFileList.length > 0) {
						file = uploadFileList.shift();
						uploadFile(file);
					}
				}
			}

			/**
			 * uploadFile upload the file
			 * 
			 * @param file $file 
			 * @return void
			 */
			function uploadFile(file) {
				//on s'abonne à l'événement progress pour savoir où en est l'upload
				if (xhr.upload && options.beforeUpload()) {
					xhr.open("POST", options.url, true);

					// on s'abonne à tout changement de statut pour détecter
					// une erreur, ou la fin de l'upload
					//xhr.onreadystatechange = onStateChange; 

					/* event listners */
					xhr.upload.addEventListener('progress',  onUploadProgress, false);
					xhr.addEventListener("load", uploadComplete, false);
					xhr.addEventListener("error", uploadFailed, false);
					xhr.addEventListener("abort", uploadCanceled, false);

					xhr.setRequestHeader("Content-Type", "multipart/form-data");
					xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
					xhr.setRequestHeader("X-File-Name", file.name);
					xhr.setRequestHeader("X-File-Size", file.size);
					xhr.setRequestHeader("X-File-Type", file.type);
				
					xhr.send(file);
				}
			}

			/**
			 * onFilesSelected 
			 * 
			 * @param event $event 
			 * @return void
			 */
			function onFilesSelected(event) {
				event.preventDefault();
				event.stopPropagation();
				addFiles(event.target.files);

				return options.onFilesSelected();
			}

			/**
			 * addFiles add files to the file list
			 * 
			 * @param files $files 
			 * @return void
			 */
			function addFiles(files) {
				if (fileApiSupported()) {
					// preparing thumbnails div
					prepareThumbnails();

					var img = null;
					var reader = null;

					var dropZoneElement = options.dropZone;
					for (var i=0; i < files.length; i++) {
						if (options.maxFileSize > 0 && file.size > options.maxFileSize) {
							return options.error('file too big');
						} else {
							if (options.showThumbnails == true) {
								reader = new FileReader();
								reader.onloadend = function (evt) {
									var thumb = new Image();
									thumb.src = evt.target.result;
									if (options.thumbnails.width > 0) {
										thumb.width = options.thumbnails.width;
									}
									if (options.thumbnails.height > 0) {
										thumb.height = options.thumbnails.height;
									}
									options.thumbnails.div.append(thumb);

								 };
								reader.readAsDataURL(files[i]);
							}

							try {
								addUploadFile(files[i]);
							} catch (e) {
								uploadFailed();
							}
						}
					}
			   } else {
				   alert('files api not supported');
			   }
			}

			/**
			 * prepare thumbnails div
			 * 
			 * @return void
			 */
			function prepareThumbnails() {
				if (options.thumbnails) {
					if (typeof options.thumbnails != 'object') {
						var tmpDiv = null;
						if (typeof options.thumbnails == 'string') {
							tmpDiv = $(options.thumbnails);
						}
						options.thumbnails = { div: tmpDiv, width: null, height: null };
					}

					if (typeof options.thumbnails.div == 'string') {
						options.thumbnails.div = $(options.thumbnails.div);
					}

					if (typeof options.thumbnails == 'object' && options.thumbnails.div == undefined) {
						options.thumbnails = { div: options.thumbnails, width: null, height: null };
					}

					if (options.thumbnails.div == null) {
						options.thumbnails.div = $('<div class="fileUploadThumbnails" />');
						options.dropZone.after(options.thumbnails.div);
					}
				}
			}



			// =============================== 
			// main process
			// =============================== 

			// Dropzone management
			if (options.dropZone != null) {
				options.dropZone.on('dragleave', onDragLeave);
				options.dropZone.on('dragenter', onDragEnter);
				options.dropZone.on('dragover', onDragOver);
				options.dropZone.on('drop', onDrop);
			}

			if (options.fileField != null) {
				if (typeof options.fileField == 'string') {
					options.fileField = $(options.fileField);
				}
				options.fileField.on('change', onFilesSelected);
			}

			return this;
		};
	})(jQuery);
}
