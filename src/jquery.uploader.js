/**
 * ImageUploader (for jQuery)
 * version: 1.0 (29/01/2012)
 * @requires jQuery v1.4.0 or later
 * @author Julien DENIAU
 */

if(typeof jQuery !== undefined){
    (function($){
        // init
        var ImageUploader = function (params) {
            this.init(params);
            this.main();
        }

        // default settings
        ImageUploader.defaults = {
            fileField: null,
            urlField: null,
            urlFieldSubmit: null,

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
            error: function(msg) { alert(msg); }
        }

        ImageUploader.prototype = {
            // Init
            init: function (params) {
                instance = this;
                this.options = $.extend({}, ImageUploader.defaults, params);

                this.canUpload = true;
                this.uploadFileList = new Array();
                this.allUploadedFileList = new Array();
                this.currentThumbnail = null;
            },

            /**
             * fileApiSupported check if the file api is supported
             *
             * @return void
             */
            fileApiSupported: function() {
                return (window.File && window.FileReader && window.FileList && window.FormData);
            },

            /**
             * onDragLeave
             *
             * @param event $event
             * @return void
             */
            onDragLeave: function(event) {
                if ($(event.target)[0] === instance.options.dropZone[0]) {
                    //you can remove a style from the drop zone
                    return instance.options.onDragLeave(event);
                }
            },

            /**
             * onDragEnter
             *
             * @param {Event} event
             * @return void
             */
            onDragEnter: function (event) {
                if ($(event.target)[0] === instance.options.dropZone[0]) {
                    //you can add a style to the drop zone
                    return instance.options.onDragEnter(event);
                }
            },

            /**
             * onDragStart
             *
             * @param {Event} event
             * @return void
             */
            onDragStart: function (event) {
                event.preventDefault();
                event.stopPropagation();
                return instance.options.onDragStart(event);
            },

            /**
             * onDragEnd
             *
             * @param {Event} event
             * @return void
             */
            onDragEnd: function (event) {
                event.preventDefault();
                event.stopPropagation();
                return instance.options.onDragEnd(event);
            },

            /**
             * onDragOver
             *
             * @param event $event
             * @return void
             */
            onDragOver: function (event) {
                event.preventDefault();
                event.stopPropagation();
                //event.originalEvent.dataTransfer.effectAllowed= "copy";
                //event.originalEvent.dataTransfer.dropEffect = "copy";

                return instance.options.onDragOver(event);
            },

            /**
             * onDrop
             *
             * @param event $event
             * @return void
             */
            onDrop: function (event) {
                event.preventDefault();
                event.stopPropagation();
                instance.addFiles(event.originalEvent.dataTransfer.files);

                return instance.options.onDrop(event);
            },


            uploadStarted: function (event) {
                if (instance.options.thumbnails) {
                    instance.currentThumbnail = instance.options.thumbnails.div.find('[data-upload-status="waiting"]:first');
                    instance.currentThumbnail.attr('data-upload-status', 'uploading');
                    instance.currentThumbnail.append($('<div class="progress" />').append($('<div />')));
                }
            },

            /**
             * onUploadProgress
             *
             * @param event $event
             * @return void
             */
            onUploadProgress: function (event) {
                if (event.lengthComputable) {
                    if (!instance.currentThumbnail || instance.currentThumbnail.length == 0) {
                        instance.uploadStarted();
                        //instance.currentThumbnail = instance.options.thumbnails.div.find('[data-upload-status="uploading"]:first');
                    }

                    if (instance.currentThumbnail) {
                        instance.currentThumbnail.find('.progress > div').width(event.loaded * 100 / event.total + '%');
                    }
                }

                return instance.options.onUploadProgress(event);
            },

            /**
             * uploadComplete
             *
             * @return void
             */
            uploadComplete: function (event) {
                xhr = event.currentTarget;
                instance.canUpload = true;

                if (xhr.status == 200) {
                    var thumbnailToReturn = null;
                    if (instance.currentThumbnail) {
                        instance.currentThumbnail.find('.progress > div').width('100%');
                        thumbnailToReturn = instance.currentThumbnail;
                        instance.currentThumbnail = null;
                    }
                    instance.options.afterUpload(event.target.response, thumbnailToReturn);
                    instance.uploadNextFile();
                } else {
                    instance.uploadFailed();
                }
            },

            /**
             * uploadFailed
             *
             * @return void
             */
            uploadFailed: function () {
                this.canUpload = true;
                if (this.currentThumbnail) {
                    this.currentThumbnail.remove();
                }
                this.currentThumbnail = null;
                this.options.error('upload failed');
                this.uploadNextFile();
            },

            /**
             * uploadCanceled
             *
             * @return void
             */
            uploadCanceled: function () {
                this.canUpload = true;
                this.currentThumbnail = null;
                this.options.error('upload canceled');
                this.uploadNextFile();
            },

            /**
             * addUploadFile
             *
             * @param file $file
             * @access public
             * @return void
             */
            addUploadFile: function (file) {
                this.allUploadedFileList.push(file);
                this.uploadFileList.push(file);
                this.uploadNextFile();
            },

            /**
             * fileAlreadyUploaded
             *
             * @param file $file
             * @access public
             * @return boolean
             */
            fileAlreadyUploaded: function (file) {
                for (i in this.allUploadedFileList) {
                    f = this.allUploadedFileList[i];
                    if (file.name == f.name && file.size == f.size && file.type == f.type) {
                        return true;
                    }
                }
                return false;
            },

            /**
             * uploadNextFile
             *
             * @access public
             * @return void
             */
            uploadNextFile: function () {
                if (this.canUpload && this.uploadFileList.length > 0) {
                    file = this.uploadFileList.shift();
                    this.canUpload = false;
                    this.uploadFile(file);
                }
            },

            /**
             * uploadFile upload the file
             *
             * @param file $file
             * @return void
             */
            uploadFile: function (file) {
                xhr = new XMLHttpRequest();
                if (xhr.upload && this.options.beforeUpload()) {
                    xhr.open("POST", this.options.url);

                    if (file instanceof File) {
                        var fd = new FormData();
                        fd.append('file', file);
                    } else {
                        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                        var fd = 'url=' + encodeURIComponent(file.name);
                    }


                    /* event listners */
                    xhr.upload.addEventListener('progress',  this.onUploadProgress, false);
                    xhr.addEventListener("loadstart", this.uploadStarted, false);
                    xhr.addEventListener("load", this.uploadComplete, false);
                    xhr.addEventListener("error", this.uploadFailed, false);
                    xhr.addEventListener("abort", this.uploadCanceled, false);

                    //xhr.setRequestHeader("Content-Type", "multipart/form-data");
                    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    //xhr.setRequestHeader("X-File-Name", file.name);
                    //xhr.setRequestHeader("X-File-Size", file.size);
                    //xhr.setRequestHeader("X-File-Type", file.type);

                    xhr.send(fd);
                }
            },

            /**
             * onFilesSelected
             *
             * @param event $event
             * @return void
             */
            onFilesSelected: function (event) {
                event.preventDefault();
                event.stopPropagation();
                instance.addFiles(event.target.files);
                $(this).val('');

                return instance.options.onFilesSelected();
            },

            /**
             * onUrlSelected
             *
             * @param event $event
             * @return void
             */
            onUrlSelected: function (event) {
                var url = instance.options.urlField.val();
                if (url) {
                    instance.addFileByUrl(url);
                }

                return instance.options.onUrlSelected();
            },

            /**
             * add a file by Url
             */
            addFileByUrl: function (url) {
                return this.addFile({ name: url });
            },

            /**
             * addFile add a single file to the file list
             */
            addFile: function (file) {
                return this.addFiles([file]);
            },

            /**
             * addFiles add files to the file list
             *
             * @param files $files
             * @return void
             */
            addFiles: function (files) {
                if (this.fileApiSupported()) {
                    var reader = null;

                    for (var i=0; i < files.length; i++) {
                        if (this.options.maxFileSize > 0 && file.size > this.options.maxFileSize) {
                            return this.options.error('the file you are trying to upload is too big');
                        } else if (!this.options.allowDuplicate && this.fileAlreadyUploaded(files[i])) {
                            return this.options.error('the file you are trying to upload has already been sent');
                        } else {
                            this.options.onFileAdded(files[i]);

                            if (this.options.thumbnails || this.options.thumbnailReady != $.noop) {
                                if (files[i] instanceof File) {
                                    this.options.thumbnails.div.file = files[i];
                                    reader = new FileReader();
                                    reader.onload = function (evt) {
                                        instance.displayImage(evt.target.result);
                                     };
                                    reader.readAsDataURL(files[i]);
                                } else {
                                    this.displayImage(files[i].name);
                                }
                            }

                            try {
                                this.addUploadFile(files[i]);
                            } catch (e) {
                                this.uploadFailed();
                            }
                        }
                    }
               } else {
                   alert('files api not supported');
               }
            },

            displayImage: function (src) {
                var thumb = new Image();
                thumb.src = src;
                $(thumb).hide();
                var thumbContainer = $('<div />')
                    .attr('data-upload-status', 'waiting')
                    .css({'overflow': 'hidden', 'position': 'relative'})
                    .append(thumb);

                thumb.onload = function() {
                    var otw = instance.options.thumbnails.width;
                    var oth = instance.options.thumbnails.height;
                    var ratio = thumb.width / thumb.height;

                    if (instance.options.thumbnails.crop && otw > 0 && oth > 0) {
                        thumbContainer.width(otw);
                        thumbContainer.height(oth);
                        $(thumb).css('position', 'absolute');
                        var wantedRatio = otw / oth;

                        if (wantedRatio > ratio) {
                            // portrait image
                            if (instance.options.thumbnails.crop == 'zoom') {
                                thumb.width = otw;
                                thumb.height = otw / ratio;
                                $(thumb).css('top', '-' + parseInt((thumb.height - oth) / 2) + 'px');
                            } else {
                                thumb.width = oth * ratio;
                                thumb.height = oth;
                                $(thumb).css('left', parseInt((otw - thumb.width) / 2) + 'px');
                            }
                        } else {
                            if (instance.options.thumbnails.crop == 'zoom') {
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

                if (instance.options.thumbnailReady != $.noop) {
                    instance.options.thumbnailReady(thumbContainer);
                } else {
                    instance.options.thumbnails.div.append(thumbContainer);
                }
            },

            /**
             * prepare thumbnails div
             *
             * @return void
             */
            prepareThumbnails: function () {
                if (this.options.thumbnails) {
                    if (typeof this.options.thumbnails != 'object') {
                        var tmpDiv = null;
                        if (typeof this.options.thumbnails == 'string') {
                            tmpDiv = $(this.options.thumbnails);
                        }
                        this.options.thumbnails = { div: tmpDiv, width: null, height: null };
                    }

                    if (typeof this.options.thumbnails.div == 'string') {
                        this.options.thumbnails.div = $(this.options.thumbnails.div);
                    }

                    if (typeof this.options.thumbnails == 'object' && this.options.thumbnails.div == undefined) {
                        this.options.thumbnails.div = null;
                    }

                    if (this.options.thumbnails.div == null) {
                        this.options.thumbnails.div = $('<div class="fileUploadThumbnails" />');
                        this.options.dropZone.after(this.options.thumbnails.div);
                    }
                }
            },

            main: function() {
                // ===============================
                // main process
                // ===============================
                var othis = this;

                // Dropzone management
                if (this.options.dropZone != null) {
                    this.options.dropZone.on('dragstart', this.onDragStart);
                    this.options.dropZone.on('dragend', this.onDragEnd);
                    this.options.dropZone.on('dragleave', this.onDragLeave);
                    this.options.dropZone.on('dragenter', this.onDragEnter);
                    this.options.dropZone.on('dragover', this.onDragOver);
                    this.options.dropZone.on('drop', this.onDrop);
                }

                if (this.options.fileField != null) {
                    // open fileField on click on the dropZone
                    if (typeof this.options.fileField == 'string') {
                        this.options.fileField = $(this.options.fileField);
                    }
                    this.options.dropZone.on('click', function() {
                        othis.options.fileField.trigger('click');
                    });

                    this.options.fileField.on('change', this.onFilesSelected);
                    if (this.options.hideFileField == true) {
                        this.options.fileField.hide();
                    }
                }

                if (this.options.urlField != null) {
                    if (typeof this.options.urlField == 'string') {
                        this.options.urlField = $(this.options.urlField);
                    }

                    if (this.options.urlFieldSubmit !== null) {
                        if (typeof this.options.urlFieldSubmit == 'string') {
                            this.options.urlFieldSubmit = $(this.options.urlFieldSubmit);
                        }
                        this.options.urlFieldSubmit.on('click', this.onUrlSelected);
                    } else {
                        this.options.urlField.on('change', this.onUrlSelected);
                    }

                    if (this.options.hideUrlField == true) {
                        this.options.urlField.hide();
                    }
                }

                // preparing thumbnails div
                this.prepareThumbnails();

                return this;
            }
        };

        $.fn.imageUploader = function(params) {
            params = $.extend({ dropZone: $(this) }, params);
            var instance = new ImageUploader(params);

            $(this).data('imageUploader', instance);

            return this;
        };

    })(jQuery);
}
