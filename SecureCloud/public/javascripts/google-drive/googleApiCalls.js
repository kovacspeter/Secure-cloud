
// Enter a client ID for a web application from the Google Developer Console.
// In your Developer Console project, add a JavaScript origin that corresponds to the domain
// where you will be running the script.
var clientId = '1079273904456-fnhtnp9jsenjlanmoo679c09u0edq34r';

// Enter the API key from the Google Develoepr Console - to handle any unauthenticated
// requests in the code.
var apiKey = 'AIzaSyBdkCmzx8vRPaJ9C-kn2U0tDsGK8MbmHaA';

// To enter one or more authentication scopes, refer to the documentation for the API.
var scopes = 'https://www.googleapis.com/auth/drive';


/**
 * Use a button to handle authentication the first time.
 */
function handleClientLoad() {
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth,1);
    $('#auth').click(handleAuthClick);
}

/**
 * Check if the current user has authorized the application.
 */
function checkAuth() {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}
/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        log('auth success');
    } else {
        log('auth failed');
    }
}

/**
 * Check if the current user has authorized the application after clicking on Authorize button.
 */
function handleAuthClick(event) {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
    return false;
}

function log(text) {
    console.log(text);
}
/**
 * Retrieve a file metadata of files belonging to a folder.
 *
 * @param {String} fileId ID of the file to retrieve metadata from.
 * @param {Function} callback Function to call when the request is complete.
 *
 */
function getFileMetadata(fileId, callback) {
    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.request({
            'path': 'drive/v2/files/'+ fileId,
            'method': 'GET',
            'body': {
                'fileId': fileId
            }
        });

        request.execute(callback);
    });
}

/**
 * Retrieve a list of files belonging to a folder.
 *
 * @param {String} folderId ID of the folder to retrieve files from.
 * @param {Function} callback Function to call when the request is complete.
 *
 */
function getFolderChildren(folderId, callback) {
    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.request({
            'path': 'drive/v2/files/'+ folderId + '/children',
            'method': 'GET',
            'body': {
                'folderId': folderId,
                'maxResults': 300
            }
        });

        request.execute(callback);
    });
}

/**
 * Insert new file.
 * @param {String} title Name of inserted file.
 * @param {Function} callback Function to call when the request is complete.
 */
function insertFile(title, callback) {
    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'POST',
            'body':{
                'title': title,// + '.scf',
                'mimeType': 'application/octet-stream'
            }
        });
        request.execute(callback);
    });
}

/**
 * Update an existing file's metadata and content.
 *
 * @param {String} metadata Metadata of the file to update.
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Callback function to call when the request is complete.
 */
function updateFileResumable(metadata, fileData, callback) {
    var accessToken = gapi.auth.getToken().access_token;

    var reader = new FileReader();
    reader.readAsArrayBuffer(fileData);
    reader.onload = function() {
        var key = prompt("Give key used for file encryption","password");
        var bits = sjcl.codec.bytes.toBits(new Uint8Array(reader.result));
        var crypt = sjcl.encrypt(key, bits);
        var blob = new Blob([crypt]);

        var uploader = new MediaUploader({
            metadata: metadata,
            file: blob,
            token: accessToken,
            onComplete: callback,
            onError: function(err) {
                log(err);
            }
        });
        log('sending to cloud');
        uploader.upload();
    }
}

/**
* Download a file's content.
*
* @param {File} file Drive File instance.
* @param {Function} callback Function to call when the request is complete.
*/
function downloadFileFromDrive(file, callback) {
    if (file.downloadUrl) {
        var accessToken = gapi.auth.getToken().access_token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', file.downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function() {
            if(file.title.indexOf('.sc') > -1) {
                var key = prompt("Please enter key for file decryption","password");
                var base64decrypt = sjcl.decrypt(key, xhr.response, {'raw': 1});
                var byteNumbers = sjcl.codec.bytes.fromBits(base64decrypt);
                var byteArray = new Uint8Array(byteNumbers);
                var title = '';
                var titleArray = file.title.split('.');
                for(i=0; i<titleArray.length - 1; i++){
                    title = title + "." + titleArray[i];
                }
                callback({
                    'title': title,
                    'data': byteArray
                });
            } else {
                alert("only .sc file supported for now");
                //var byteNumbers = _fromBitArrayCodec(xhr.response);
                //var byteArray = new Uint8Array(byteNumbers);
                //console.log(byteNumbers);
                //console.log(byteArray);
                //callback({
                //    'title': file.title,
                //    'data': xhr.responseText
                //});
            }
        };
        xhr.onerror = function() {
            log("ERROR! Daco si pokazil :D");
            callback(null);
        };
        xhr.send();
    } else {
        log("ERROR MISSING DOWNLOAD URL");
        callback(null);
    }
}

/**
 * Returns file's parents.
 *
 * @param {String} fileId ID of the file to insert.
 */
function printParents(fileId) {
    var request = gapi.client.drive.parents.list({
        'fileId': fileId
    });
    request.execute(function(resp) {
        for (parent in resp.items) {
            console.log('File Id: ' + resp.items[parent].id);
        }
    });
}
