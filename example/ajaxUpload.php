<?php
//http://www.profilepicture.co.uk/tutorials/ajax-file-upload-xmlhttprequest-level-2/

class UploadException extends Exception {}

class File_Streamer
{
    private $fileName;
    private $contentLength;
    private $path;

    public function __construct()
    {
    }

    public function setDestination($p)
    {
        $this->path = $p;
    }

    public function receive()
    {
        $isFile = false;

        if (isset($_FILES['file'])) {
            $file = $_FILES['file'];

            if (is_uploaded_file($file['tmp_name'])) {
                $filename = $file['name'];
            }

            $isFile = true;
        }

        if (isset($_POST['url'])) {
            $filename = $_POST['url'];
        }

        if (!empty($filename)) {
            try {
                $tmpName = basename($filename);
                $fileName = date('Ymd-His-') . mt_rand() . '-' . $tmpName;
                $uploadFile = $this->path . $fileName;

                if ($isFile) {
                    if (!move_uploaded_file($file['tmp_name'], $uploadFile)) {
                        throw new UploadException('Unable to upload file');
                    }
                } else {
                    $content = @file_get_contents($filename);
                    if ($content) {
                        file_put_contents($uploadFile, $content);
                    }
                }

                if (!file_exists($uploadFile)) {
                    throw new UploadException('Unable to upload file : file not found');
                }

                if (filesize($uploadFile) > 5242880) {
                    throw new UploadException('Unable to upload file : file too big');
                }

                $fileInfo = @getimagesize($uploadFile);

                if (empty($fileInfo)) {
                    throw new UploadException('File is not an image');
                }

                $allowedMimeType = array(
                        'image/gif',
                        'image/jpeg',
                        'image/png'
                        );

                if (!in_array($fileInfo['mime'], $allowedMimeType)) {
                    throw new UploadException('File type not allowed');
                }

                /*
                   if ($fileInfo[0] > 3000 || $fileInfo[1] > 3000) {
                   throw new UploadException('Unable to upload file : file too big');
                   }
                 */

                return $fileName;
            } catch (UploadException $e) {
                @unlink($uploadFile);
            }
        }



        if (!$this->contentLength > 0) {
            throw new Exception('No file uploaded!');
        }

        //file_put_contents(
        //    $this->path . $this->fileName,
        //    file_get_contents("php://input")
        //);

        return true;
    }
}

try {
    $fs = new File_Streamer();
    $fs->setDestination('/tmp/testjdu/');
    echo $fs->receive();
} catch (\Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
}
