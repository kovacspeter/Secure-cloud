//TODO REVRITE TO PROTOTYPE??

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
function handleClientLoadGoogle() {
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuthGoogle,1);
    handleAuthClickGoogle;
}

/**
 * Check if the current user has authorized the application.
 */
function checkAuthGoogle() {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResultGoogle);
}
/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResultGoogle(authResult) {
    if (authResult && !authResult.error) {
        console.log('auth success');
    } else {
        console.log('auth failed');
        console.log(authResult.error);
        console.log(authResult);
    }
}

/**
 * Retrieve a file metadata of files belonging to a folder.
 *
 * @param {String} fileId ID of the file to retrieve metadata from.
 * @param {Function} callback Function to call when the request is complete.
 *
 */
function getFileMetadataGoogle(fileId, callback) {
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
 * Check if the current user has authorized the application after clicking on Authorize button.
 */
function handleAuthClickGoogle(event) {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResultGoogle);
    return false;
}

function getSharedWithMeFilesGoogle(callback) {
    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.request({
            'path': 'drive/v2/files?q=sharedWithMe=true',
            'method': 'GET'
        });

        request.execute(callback);
    });
}

/**
 * Print the Permission ID for an email address.
 *
 * @param {String} email Email address to retrieve ID for.
 */
function printPermissionIdForEmailGoogle(email, callback) {
    var request = gapi.client.drive.permissions.getIdForEmail({
        'email': email
    });
    request.execute(function(resp) {
        callback(resp.id);
    });
}

/**
 * Update a permission's role.
 *
 * @param {String} fileId ID of the file to update permission for.
 * @param {String} permissionId ID of the permission to update.
 * @param {String} newRole The value "owner", "writer" or "reader".
 */
function updatePermissionGoogle(fileId, permissionId, newRole, callback) {
    // First retrieve the permission from the API.
    var request = gapi.client.drive.permissions.get({
        'fileId': fileId,
        'permissionId': permissionId
    });
    request.execute(function(resp) {
        resp.role = newRole;
        var updateRequest = gapi.client.drive.permissions.update({
            'fileId': fileId,
            'permissionId': permissionId,
            'resource': resp
        });
        updateRequest.execute(function(resp) {
            callback(resp);
        });
    });
}

/**
 * Insert a new permission.
 *
 * @param {String} fileId ID of the file to insert permission for.
 * @param {String} email User or group e-mail address, domain name or
 *                       {@code null} "default" type.
 * @param {String} type The value "user", "group", "domain" or "default".
 * @param {String} role The value "owner", "writer" or "reader".
 */
function insertPermissionGoogle(fileId, email, type, role, callback) {
    var body = {
        'value': email,
        'type': type,
        'role': role
    };
    var request = gapi.client.drive.permissions.insert({
        'fileId': fileId,
        //'emailMessage': 'You have been granted access for file via SecureCloud platform, due to encryption' +
        //'you can only access it trough www.securecloud.com domain.',
        'resource': body
    });
    request.execute(function(resp) {
        callback(resp);
    });
}

/**
 * Retrieve a list of permissions.
 *
 * @param {String} fileId ID of the file to retrieve permissions for.
 * @param {Function} callback Function to call when the request is complete.
 */
function retrievePermissions(fileId, callback) {
    var request = gapi.client.drive.permissions.list({
        'fileId': fileId
    });
    request.execute(function(resp) {
        callback(resp.items);
    });
}

/**
 * Remove a permission.
 *
 * @param {String} fileId ID of the file to remove the permission for.
 * @param {String} permissionId ID of the permission to remove.
 */
function removePermissionGoogle(fileId, permissionId, callback) {
    var request = gapi.client.drive.permissions.delete({
        'fileId': fileId,
        'permissionId': permissionId
    });
    request.execute(function(resp) {
        callback(resp);
    });
}

/**
 * Stops sharing file with user
 *
 * @param {String} fileId id of file on which sharing will be removed
 * @param {String} email of user
 * @param {Function} callback Function to call when the request is complete.
 */
function stopShareingFileGoogle(fileId, email, callback) {
    retrievePermissions(fileId, function(permissions) {
        for(var permission in permissions) {
            if (permissions[permission].emailAddress == email) {
                var permId = permissions[permission].id;
                removePermissionGoogle(fileId, permId, function(resp) {
                    callback(resp);
                });
            }
        }
    });
}

/**
 * Request google to share file with user, and make necessary crypto stuff for sharing
 *
 * @param {String} fileId of file which will be shared
 * @param {String} email address of user with who it will be shared
 */
function shareFileGoogle(fileId, email, role, callback) {

    getFileKey(fileId, function(fileKey) {
        getPubKey(email, function (pubKey) {

            //ENCRYPT FILEKEY WITH PUB-KEY OF USER I AM SHARING WITH
            var shareFileKey = sjcl.encrypt(pubKey, fileKey);

            //SAVE NEW ENCRYPTED KEY
            saveFileKey(email, shareFileKey, fileId, function(saveFileKeyResponse) {

                alert('File shared successfully');
                //SHARE ON GOOGLE DRIVE (ADD PERMISSION FOR USER)
                insertPermissionGoogle(fileId, email, 'user', role, function(resp) {
                    callback(resp);
                });
            });
        });
    });
}

/**
 * Retrieve a list of files belonging to a folder.
 *
 * @param {String} folderId ID of the folder to retrieve files from.
 * @param {Function} callback Function to call when the request is complete.
 *
 */
function getFolderChildrenGoogle(folderId, callback) {
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
function insertFileGoogle(title, callback) {
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
 * Generates random string from sjcl.random
 *
 * @param {Function} callback Callback function to call when string is generated
 */
function createRandomString (callback) {
    var randomBase64String = '';
    var checkReadyness;

    checkReadyness = setInterval(function () {
        if(sjcl.random.isReady(10)) {
            randomWords = sjcl.random.randomWords(4,10);
            for(var i in randomWords) {
                randomBase64String += btoa(randomWords[i]);
            }
            clearInterval(checkReadyness);
            callback(randomBase64String);
        }
    }, 1);
}

/**
 * Returns public key of specified user and call callback function with public key as parameter
 *
 * @param {String} userEmail Email of user whose public key is returned
 * @param {Function} callback Callback function to call when pub key is acquired
 */
function getPubKey(userEmail, callback) {
    $.post('/getPubKey', {'email': userEmail}, function(res) {
        console.log(res);
        //DESERIALIZING PUBLIC KEY
        var pub = new sjcl.ecc.elGamal.publicKey(
            sjcl.ecc.curves.c256,
            sjcl.codec.base64.toBits(res)
        );
        callback(pub);
    })
        .fail(function() {
            alert('User ' + userEmail + 'not registered');
        });
}

/**
 * Returns private key of logged user and call callback function with private key as parameter
 *
 * @param {Function} callback Callback function to call when priv key is acquired
 */
function getPrivKey(callback) {
    $.get('/getPrivKey', function(res) {
        try {
            // DECRYPTS PRIVATE KEY WITH USERS KEY
            var userKey = prompt('Please enter your password', 'Enter your password here');
            var privKey = sjcl.decrypt(userKey, res);

            // DESERIALIZING PRIVATE KEY
            var sec = new sjcl.ecc.elGamal.secretKey(
                sjcl.ecc.curves.c256,
                sjcl.ecc.curves.c256.field.fromBits(sjcl.codec.base64.toBits(privKey))
            );

            callback(sec);
        } catch (err) {
            alert('Error getting privateKey \n' + err);
        }
    })
        .fail(function() {
            alert('Problem retrieving private key from server');
        });
}

/**
 * Returns file key of logged user and call callback function with key as parameter
 *
 * @param {Function} callback Callback function to call when file key is acquired
 */
function getFileKey(fileId, callback) {

    $.post('/getFileKey', {'fileId': fileId}, function(encFileKey) {
        getPrivKey(function (privKey) {

            try {
                // DECRYPTS FILE KEY WITH USERS PRIVATE KEY
                var fileKey = sjcl.decrypt(privKey, encFileKey);
            } catch (err) {
                alert('Error getting fileKey' + err);
            }

            callback(fileKey);
        });
    }).fail(function() {
        alert('Such file key can not be retrieved');
    });
}
/**
 * Saves file key on server
 *
 * @param {String} email of user with whose pass its encrypted
 * @param {Object} encPass encrypted password for file
 * @param {String} id of file
 * @param {Function} callback function to be called after request is done
 */
function saveFileKey(email, encPass, id, callback) {
    $.post('/saveFileKey', {
        user: email,
        password: encPass,
        id: id
    }, callback);
}

/**
 * Saves keypair(private key encrypted) in database on server
 *
 * @param {object} keyPair containing private and public key
 * @param {Function} callback will be called with respond from server
 */
function saveKeyPair(keyPair, callback) {
    // SEND KEYPAIR TO SERVER
    $.post('/saveKeypair', keyPair, function (res2) {
        callback(res2);
    });
}

/**
 * Calls sjcl to generate asymetric keypair encrypt private key and save pair to server
 *
 * @returns {*}
 */
function generateKeyPair(callback) {
    var keys = sjcl.ecc.elGamal.generateKeys(256);

    //SERIALIZING KEYPAIR
    var pub = keys.pub.get();
    var sec = keys.sec.get();
    var serializedKeyPair = {
        pub: sjcl.codec.base64.fromBits(pub.x.concat(pub.y)),
        priv: sjcl.codec.base64.fromBits(sec)
    };

    // ASKING USER FOR HIS PASSWORD
    var passwd = prompt('Enter your new universal password.  ' +
    'You will need this password to decrypt and share files', 'Password here');
    // ENCRYPTING USERS PRIVATE KEY
    var enc = sjcl.encrypt(passwd, serializedKeyPair.priv);
    serializedKeyPair.priv = enc;

    // SENDING KEYPAIR TO SERVER
    saveKeyPair(serializedKeyPair, callback);
}


/**
 * Update an existing file's metadata and content.
 *
 * @param {String} metadata Metadata of the file to update.
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Callback function to call when the request is complete.
 */
function updateFileResumableGoogle(metadata, fileData, callback) {
    var accessToken = gapi.auth.getToken().access_token;
    var email = $.cookie('email');

    //GET PUBLIC KEY OF LOGGED USER
    getPubKey(email, function(pubKey) {

        //GENERATE PASSWORD FOR FILE ENCRYPTION
        createRandomString(function (passString) {

            // FILE UPLOAD
            var reader = new FileReader();
            reader.readAsArrayBuffer(fileData);
            reader.onload = function() {
                //FILE ENCRYPTION
                alert('Encrypting, click ok to continue!');
                var bits = sjcl.codec.bytes.toBits(new Uint8Array(reader.result));
                var crypt = sjcl.encrypt(passString, bits);
                var blob = new Blob([crypt]);

                alert('Uploading, click ok to continue!');
                //ACTUAL UPLOADING
                var uploader = new MediaUploader({
                    metadata: metadata,
                    file: blob,
                    token: accessToken,
                    onComplete: function(gResp) {

                        //FILE PASSWORD ENCRYPTION
                        var encPass = sjcl.encrypt(pubKey, passString);
                        gResp = JSON.parse(gResp);

                        //SENDING ENCRYPTED FILE PASSWORD TO SERVER
                        saveFileKey(email, encPass, gResp.id, callback);
                        alert('Successfully uploaded');
                    },
                    onError: function(err) {
                        log(err);
                    }
                });
                uploader.upload();
            };
        });
    });
}

/**
 * Download a file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
function downloadFileGoogle(file, callback) {
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    //ITS GOOGLE DRIVE FILE (google-docs)
    if (file.downloadUrl == undefined) {
        // TODO UI FOR SELECTING SUPPORTED FORMATS
        alert('Google Docs support is limited for now(UI needed) -> downloading plaintext form')
        xhr.open('GET', file.exportLinks['text/plain']);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

        xhr.responseType = 'arraybuffer';
        alert('Downloading');
        xhr.onload = function () {
            var byteArray = new Uint8Array(xhr.response);
            callback({
                'title': file.title,
                'data': byteArray
            });
        };
    //IT IS NORMAL FILE (pdf,txt,...)
    } else {
        xhr.open('GET', file.downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        // ITS ENCRYPTED FILE
        if (file.title.indexOf('.sc') > -1) {
            alert('Downloading file, click ok to continue!');
            xhr.onload = function () {
                getFileKey(file.id, function (fileKey) {

                    alert('Decrypting, click ok to continue!');
                    // DECRYPT FILE
                    try {
                        var base64decrypt = sjcl.decrypt(fileKey, xhr.response, {'raw': 1});
                        var byteArray = new Uint8Array(sjcl.codec.bytes.fromBits(base64decrypt));

                        // ASSIGN TITLE WITHOUT .SC TO FILE
                        var title = '';
                        var titleArray = file.title.split('.');
                        for (i = 0; i < titleArray.length - 1; i++) {
                            title = title + "." + titleArray[i];
                        }

                        // PASS DOWNLOADED FILE TO CALLBACK
                        callback({
                            'title': title,
                            'data': byteArray
                        });
                    }
                    catch (err) {
                        alert("Something went wrong!");
                        alert(err.message);
                    }
                });
            };

        }
        // ITS NOT ENCRYPTED FILE
        else {
            xhr.responseType = 'arraybuffer';
            alert('Downloading');
            xhr.onload = function () {
                var byteArray = new Uint8Array(xhr.response);
                callback({
                    'title': file.title,
                    'data': byteArray
                });
            };
        }
    }
    xhr.onerror = function () {
        alert("ERROR! Daco si pokazil :D");
        callback(null);
    };
    //TODO create progressbar on downloading/uploading/sharing...
    xhr.onprogress = function (event) {
        console.log(event.loaded / file.fileSize);
    };
    xhr.send();
}
//TODO UX TODOS:
//TODO create drag and drop file upload
//todo ------------------------
//TODO create progressbar on downloading/uploading/sharing...
//-----------------PROGRESS BAR------------------------
// progress on transfers from the server to the client (downloads)
function updateProgress (oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = oEvent.loaded / oEvent.total;
        console.log(percentComplete);
        // ...
    } else {
        console.log(oEvent);
        console.log('length uncomputable');
        // Unable to compute progress information since the total size is unknown
    }
}//------------------PROGRESS BAR------------------------

/**
 * Returns file's parents.
 *
 * @param {String} fileId ID of the file to insert.
 */
function printParentsGoogle(fileId) {
    var request = gapi.client.drive.parents.list({
        'fileId': fileId
    });
    request.execute(function(resp) {
        for (parent in resp.items) {
            console.log('File Id: ' + resp.items[parent].id);
        }
    });
}
