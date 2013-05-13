/**
 * Uploader (for jQuery)
 * version: 1.0 (29/01/2012)
 * @requires jQuery v1.4.0 or later
 * @copyright 2012 Julien DENIAU
 */
if(typeof jQuery !== undefined){
    (function($){
        /**
         * Main function
         */
        $.fn.uploader = function(params){
            // =============================== 
            // Settings 
            // =============================== 
            var options = $.extend({}, $.fn.uploader.defaults, params);
            options.dropZone = $(this);

            var canUpload = true;
            var uploadFileList = new Array();
            var currentThumbnail = null;


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
                return options.onDragLeave.call();
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
                return options.onDragEnter.call();
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

                return options.onDragOver.call();
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
                debug(event.originalEvent.dataTransfer.files);
                addFiles(event.originalEvent.dataTransfer.files);

                return options.onDrop.call();
            }



            var xhr = new XMLHttpRequest();

            function uploadStarted(event) {
                if (options.thumbnails) {
                    currentThumbnail = options.thumbnails.div.find('[data-upload-status="waiting"]:first');
                    currentThumbnail.attr('data-upload-status', 'uploading');
                    currentThumbnail.append($('<div class="progress" />').append($('<div />')));
                }
            }

            /**
             * onUploadProgress 
             * 
             * @param event $event 
             * @return void
             */
            function onUploadProgress(event) {
                if (event.lengthComputable) {
                    //debug(event.loaded + '/' + event.total);
                    if (!currentThumbnail || currentThumbnail.length == 0) {
                        uploadStarted();
                        //currentThumbnail = options.thumbnails.div.find('[data-upload-status="uploading"]:first');
                    }

                    currentThumbnail.find('.progress > div').width(event.loaded * 100 / event.total + '%');
                }

                return options.onUploadProgress.call(event);
            }

            /**
             * uploadComplete 
             * 
             * @return void
             */
            function uploadComplete(event) {
                canUpload = true;
                currentThumbnail.find('.progress > div').width('100%');
                currentThumbnail = null;
                uploadNextFile();
                return options.afterUpload.call(event.target.response);
            }

            /**
             * uploadFailed 
             * 
             * @return void
             */
            function uploadFailed() {
                canUpload = true;
                currentThumbnail = null;
                uploadNextFile();
                return options.error.call('upload failed');
            }

            /**
             * uploadCanceled 
             * 
             * @return void
             */
            function uploadCanceled() {
                canUpload = true;
                currentThumbnail = null;
                uploadNextFile();
                return options.error.call('upload canceled');
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
                    if (uploadFileList.length > 0) {
                        file = uploadFileList.shift();
                        canUpload = false;
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
                if (xhr.upload && options.beforeUpload.call()) {
                    xhr.open("POST", options.url, true);

                    // on s'abonne à tout changement de statut pour détecter
                    // une erreur, ou la fin de l'upload
                    //xhr.onreadystatechange = onStateChange; 

                    /* event listners */
                    xhr.upload.addEventListener('progress',  onUploadProgress, false);
                    xhr.addEventListener("loadstart", uploadStarted, false);
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

                return options.onFilesSelected.call();
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

                    for (var i=0; i < files.length; i++) {
                        if (options.maxFileSize > 0 && file.size > options.maxFileSize) {
                            return options.error.call('the file you are trying to upload is too big');
                        } else {
                            if (options.showThumbnails == true) {
                                var name = files[i].name;
                                reader = new FileReader();
                                reader.onloadend = function (evt) {
                                    var thumb = new Image();
                                    thumb.src = evt.target.result;
                                    //thumb.id = name;
                                    if (options.thumbnails.width > 0) {
                                        thumb.width = options.thumbnails.width;
                                    }
                                    if (options.thumbnails.height > 0) {
                                        thumb.height = options.thumbnails.height;
                                    }
                                    $(thumb).hide();
                                    options.thumbnails.div.append(
                                        $('<div />')
                                            .attr('data-upload-status', 'waiting')
                                            .append(thumb)
                                    );
                                    $(thumb).show('slow');

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
                        options.thumbnails.div = null;
                    }

                    if (options.thumbnails.div == null) {
                        options.thumbnails.div = $('<div class="fileUploadThumbnails" />');
                    debug(options.dropZone);
                        options.dropZone.after(options.thumbnails.div);
                        debug(options.thumbnails.div);
                        debug(options.dropZone);
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

        $.fn.uploader.defaults = {
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
            error: function(msg) { alert(msg); },

            debug: true
        };

        function debug(i) {
            if (window.console && window.console.log && $.fn.uploader.defaults.debug == true) {
                console.log(i);
            }
        }

    })(jQuery);
}
