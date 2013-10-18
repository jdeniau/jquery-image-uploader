/**
 * ImageUploader (for jQuery)
 * version: 1.0 (29/01/2012)
 * @requires jQuery v1.4.0 or later
 * @author Julien DENIAU
 */

if(typeof jQuery !== undefined){
    (function($){
        /**
         * Main function
         */
        $.fn.imageUploader = function(params){
            // ===============================
            // Settings
            // ===============================
            var options = $.extend({}, $.fn.imageUploader.defaults, params);
            options.dropZone = $(this);

            var canUpload = true;
            var uploadFileList = new Array();
            var allUploadedFileList = new Array();
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
                return (window.File && window.FileReader && window.FileList && window.FormData);
            }

            /**
             * onDragLeave
             *
             * @param event $event
             * @return void
             */
            function onDragLeave(event) {
                if ($(event.target)[0] === options.dropZone[0]) {
                    //you can remove a style from the drop zone
                    return options.onDragLeave(event);
                }
            }

            /**
             * onDragEnter
             *
             * @param {Event} event
             * @return void
             */
            function onDragEnter(event) {
                if ($(event.target)[0] === options.dropZone[0]) {
                    //you can add a style to the drop zone
                    return options.onDragEnter(event);
                }
            }

            /**
             * onDragStart
             *
             * @param {Event} event
             * @return void
             */
            function onDragStart(event) {
                event.preventDefault();
                event.stopPropagation();
                return options.onDragStart(event);
            }

            /**
             * onDragEnd
             *
             * @param {Event} event
             * @return void
             */
            function onDragEnd(event) {
                event.preventDefault();
                event.stopPropagation();
                return options.onDragEnd(event);
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
                //event.originalEvent.dataTransfer.effectAllowed= "copy";
                //event.originalEvent.dataTransfer.dropEffect = "copy";

                return options.onDragOver(event);
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
                addFiles(event.originalEvent.dataTransfer.files);

                return options.onDrop(event);
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
                    if (!currentThumbnail || currentThumbnail.length == 0) {
                        uploadStarted();
                        //currentThumbnail = options.thumbnails.div.find('[data-upload-status="uploading"]:first');
                    }

                    if (currentThumbnail) {
                        currentThumbnail.find('.progress > div').width(event.loaded * 100 / event.total + '%');
                    }
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

                if (this.status == 200) {
                    var thumbnailToReturn = null;
                    if (currentThumbnail) {
                        currentThumbnail.find('.progress > div').width('100%');
                        thumbnailToReturn = currentThumbnail;
                        currentThumbnail = null;
                    }
                    options.afterUpload(event.target.response, thumbnailToReturn);
                    uploadNextFile();
                } else {
                    uploadFailed();
                }
            }

            /**
             * uploadFailed
             *
             * @return void
             */
            function uploadFailed() {
                canUpload = true;
                currentThumbnail.remove();
                currentThumbnail = null;
                options.error('upload failed');
                uploadNextFile();
            }

            /**
             * uploadCanceled
             *
             * @return void
             */
            function uploadCanceled() {
                canUpload = true;
                currentThumbnail = null;
                options.error('upload canceled');
                uploadNextFile();
            }

            /**
             * addUploadFile
             *
             * @param file $file
             * @access public
             * @return void
             */
            function addUploadFile(file) {
                allUploadedFileList.push(file);
                uploadFileList.push(file);
                uploadNextFile();
            }

            /**
             * fileAlreadyUploaded
             *
             * @param file $file
             * @access public
             * @return boolean
             */
            function fileAlreadyUploaded(file) {
                for (i in allUploadedFileList) {
                    f = allUploadedFileList[i];
                    if (file.name == f.name && file.size == f.size && file.type == f.type) {
                        return true;
                    }
                }
                return false;
            }

            /**
             * uploadNextFile
             *
             * @access public
             * @return void
             */
            function uploadNextFile() {
                if (canUpload && uploadFileList.length > 0) {
                    file = uploadFileList.shift();
                    canUpload = false;
                    uploadFile(file);
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
                    xhr.open("POST", options.url);

                    if (file instanceof File) {
                        var fd = new FormData();
                        fd.append('file', file);
                    } else {
                        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                        var fd = 'url=' + file.name;
                    }


                    // on s'abonne à tout changement de statut pour détecter
                    // une erreur, ou la fin de l'upload
                    //xhr.onreadystatechange = onStateChange;

                    /* event listners */
                    xhr.upload.addEventListener('progress',  onUploadProgress, false);
                    xhr.addEventListener("loadstart", uploadStarted, false);
                    xhr.addEventListener("load", uploadComplete, false);
                    xhr.addEventListener("error", uploadFailed, false);
                    xhr.addEventListener("abort", uploadCanceled, false);

                    //xhr.setRequestHeader("Content-Type", "multipart/form-data");
                    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    //xhr.setRequestHeader("X-File-Name", file.name);
                    //xhr.setRequestHeader("X-File-Size", file.size);
                    //xhr.setRequestHeader("X-File-Type", file.type);

                    xhr.send(fd);
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
             * onUrlSelected
             *
             * @param event $event
             * @return void
             */
            function onUrlSelected(event) {
                var url = event.target.value;
                if (url) {
                    addFiles([ { name: url } ]);
                }

                return options.onUrlSelected();
            }

            /**
             * addFiles add files to the file list
             *
             * @param files $files
             * @return void
             */
            function addFiles(files) {
                if (fileApiSupported()) {
                    var reader = null;

                    for (var i=0; i < files.length; i++) {
                        options.onFileAdded(files[i]);

                        if (options.maxFileSize > 0 && file.size > options.maxFileSize) {
                            return options.error('the file you are trying to upload is too big');
                        } else if (!options.allowDuplicate && fileAlreadyUploaded(files[i])) {
                            return options.error('the file you are trying to upload has already been sent');
                        } else {
                            if (options.thumbnails || options.thumbnailReady != $.noop) {
                                console.log(files[i], typeof files[i])
                                if (files[i] instanceof File) {
                                    options.thumbnails.div.file = files[i];
                                    reader = new FileReader();
                                    reader.onload = function (evt) {
                                        displayImage(evt.target.result);
                                     };
                                    reader.readAsDataURL(files[i]);
                                } else {
                                    displayImage(files[i].name);
                                }
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

            function displayImage(src) {
                var thumb = new Image();
                thumb.src = src;
                $(thumb).hide();
                var thumbContainer = $('<div />')
                    .attr('data-upload-status', 'waiting')
                    .css({'overflow': 'hidden', 'position': 'relative'})
                    .append(thumb);

                thumb.onload = function() {
                    var otw = options.thumbnails.width;
                    var oth = options.thumbnails.height;
                    var ratio = thumb.width / thumb.height;

                    if (options.thumbnails.crop && otw > 0 && oth > 0) {
                        thumbContainer.width(otw);
                        thumbContainer.height(oth);
                        $(thumb).css('position', 'absolute');
                        var wantedRatio = otw / oth;

                        if (wantedRatio > ratio) {
                            // portrait image
                            if (options.thumbnails.crop == 'zoom') {
                                thumb.width = otw;
                                thumb.height = otw / ratio;
                                $(thumb).css('top', '-' + parseInt((thumb.height - oth) / 2) + 'px');
                            } else {
                                thumb.width = oth * ratio;
                                thumb.height = oth;
                                $(thumb).css('left', parseInt((otw - thumb.width) / 2) + 'px');
                            }
                        } else {
                            if (options.thumbnails.crop == 'zoom') {
                                thumb.height = oth;
                                thumb.width = oth * ratio;
                                $(thumb).css('left', '-' + parseInt((thumb.width - otw) / 2) + 'px');
                            } else {
                                thumb.width = otw;
                                thumb.height = oth / ratio;
                                $(thumb).css('top', parseInt((oth - thumb.height) / 2) + 'px');
                            }
                        }
                    } else {
                        if (otw > 0) {
                            thumb.width = otw;
                        } else if (oth > 0) {
                            thumb.width = oth * ratio;
                        }

                        if (oth > 0) {
                            thumb.height = oth;
                        } else if (otw > 0) {
                            thumb.height = otw / ratio;
                        }
                    }
                    $(thumb).css({ width: thumb.width, height : thumb.height });

                    $(thumb).show('slow');
                }

                if (options.thumbnailReady != $.noop) {
                    options.thumbnailReady(thumbContainer);
                } else {
                    options.thumbnails.div.append(thumbContainer);
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
                        options.dropZone.after(options.thumbnails.div);
                    }
                }
            }



            // ===============================
            // main process
            // ===============================

            // Dropzone management
            if (options.dropZone != null) {
                options.dropZone.on('dragstart', onDragStart);
                options.dropZone.on('dragend', onDragEnd);
                options.dropZone.on('dragleave', onDragLeave);
                options.dropZone.on('dragenter', onDragEnter);
                options.dropZone.on('dragover', onDragOver);
                options.dropZone.on('drop', onDrop);
            }

            if (options.fileField != null) {
                // open fileField on click on the dropZone
                options.dropZone.on('click', function() {
                    options.fileField.trigger('click');
                });

                if (typeof options.fileField == 'string') {
                    options.fileField = $(options.fileField);
                }
                options.fileField.on('change', onFilesSelected);
                if (options.hideFileField == true) {
                    options.fileField.hide();
                }
            }

            if (options.urlField != null) {
                if (typeof options.urlField == 'string') {
                    options.urlField = $(options.urlField);
                }

                options.urlField.on('change', onUrlSelected);

                if (options.hideUrlField == true) {
                    options.urlField.hide();
                }
            }

            // preparing thumbnails div
            prepareThumbnails();

            return this;
        };

        $.fn.imageUploader.defaults = {
            fileField: null,
            urlField: null,

            hideFileField: true,
            hideUrlField: true,

            url: null,

            thumbnails: {
                div: null,
                width: null,
                height: null
            },

            maxFileSize: 0,
            allowDuplicate: false,
            //progressBar: null,

            thumbnailReady: $.noop,

            onFileAdded: function(file) { return false; },
            onFilesSelected: function() { return false; },
            onUrlSelected: function() { return false; },
            onDragStart: function(event) { return false; },
            onDragEnd: function(event) { return false; },
            onDragEnter: function(event) { return false; },
            onDragLeave: function(event) { return false; },
            onDragOver: function(event) { return false; },
            onDrop: function(event) { return false; },
            onUploadProgress: function(event) { return false; },
            beforeUpload: function() { return true; },
            afterUpload: function() { return false; },
            error: function(msg) { alert(msg); },

            debug: false
        };

        function debug(i) {
            if (window.console && window.console.log && $.fn.imageUploader.defaults.debug == true) {
                console.log(i);
            }
        }

    })(jQuery);
}
