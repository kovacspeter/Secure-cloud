/**
 * Retrieve all chidrens of root folder. When finished for appends each children to html of where.
 * @param where element where drive content will be shown
 * @param folder folder(id) in drive to be shown
 */
function showMyFiles(where, folder) {
    getFolderChildrenGoogle(folder, function (children) {
        var childrenList = children.items;
        var folderList = $('<ul></ul>');
        var fileList = $('<ul></ul>');
        var back = false;

        for (var i=0; i<childrenList.length; i++) {
            getFileMetadataGoogle(childrenList[i].id, function (metadata) {
                if(!back && !metadata.parents[0].isRoot) {
                    var fileInfo = $('<li></li>');
                    fileInfo.append("<a id='drive-back'><div class='google-folder'><img src='images/folder.png'>..</div></a>");
                    folderList.append(fileInfo);
                    $('#drive-back').click(function () {
                        getFileMetadataGoogle(metadata.parents[0].id, function(r) {
                            //TODO fix if hack (shared folder root don't have parents)
                            if (r.parents[0] !== undefined) {
                                showMyFiles('files', r.parents[0].id);
                            } else {
                                showSharedWithMe('files');
                            }

                        });
                    });
                    back = true;
                }
                var fileInfo = $('<li></li>');
                if(metadata.mimeType == "application/vnd.google-apps.folder") {
                    fileInfo.append("<a id=" + metadata.id + "><div class='google-folder'><img src='images/folder.png'>" + metadata.title + "</div></a>");
                    folderList.append(fileInfo);
                    $('#' + metadata.id).click(function () {
                        showMyFiles('files', metadata.id);
                    });
                } else {
                    fileInfo.append("<a id=" + metadata.id + "><div class='google-file'><img src='images/file.png'>" + metadata.title + "</div></a>");
                    fileList.append(fileInfo);
                    $('#' + metadata.id).click(function () {
                        file = metadata;
                        $('#downloadFile').attr('disabled', false);
                    });
                }
            });
        }

        $('#' + where).html(folderList);
        $('#' + where).append(fileList);
    });
}

/**
 * Show users file which are shared with him
 *
 * @param where - element id where files will be showed
 */
function showSharedWithMe(where) {
    getSharedWithMeFilesGoogle(function(sharedFiles) {
        var childrenList = sharedFiles.items;
        var folderList = $('<ul></ul>');
        var fileList = $('<ul></ul>');
        for (var i=0; i<childrenList.length; i++) {
            getFileMetadataGoogle(childrenList[i].id, function (metadata) {
                var fileInfo = $('<li></li>');
                if(metadata.mimeType == "application/vnd.google-apps.folder") {
                    fileInfo.append("<a id=" + metadata.id + "><div class='google-folder'><img src='images/folder.png'>" + metadata.title + "</div></a>");
                    folderList.append(fileInfo);
                    $('#' + metadata.id).click(function () {
                        showMyFiles('files', metadata.id);
                    });
                } else {
                    fileInfo.append("<a id=" + metadata.id + "><div class='google-file'><img src='images/file.png'>" + metadata.title + "</div></a>");
                    fileList.append(fileInfo);
                    $('#' + metadata.id).click(function () {
                        file = metadata;
                        $('#downloadFile').attr('disabled', false);
                    });
                }
            });
        }

        $('#' + where).html(folderList);
        $('#' + where).append(fileList);
    });
}

/**
 * Uploads file from fileform to google drive storage
 */
function uploadFile() {
    if ($('input#uplFile')[0].files[0] != undefined){
        updateFileResumableGoogle({'title': $('input#uplFile')[0].files[0].name + '.sc'},$('input#uplFile')[0].files[0], function (uplResp) {
            // possible to add callback
        });
    } else {
        alert('Choose file to upload first');
    }
}


/**
 * downlaods file which was clicked in drive page.
 */
function downloadFile() {

    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var blob = new Blob([data]);
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    //TODO if its driveFile (google-doc / google-xml etc..) missing download url (need to download via export url))
    downloadFileGoogle(file, function (downResp) {
        if (downResp !== null) {
            saveData(downResp.data, downResp.title);
        }else {
            alert('Please select file by clicking on it');
        }
    });
}

/**
 * Share file with user specified in #shareWithEmail filed
 */
function shareFile() {
    var email = $('#shareWithEmail')[0].value + '@gmail.com';

    //ITS ENCRYPTED FILE
    if(file.title.indexOf('.sc') > -1) {
        //TODO 3.rd parameter role can be writer/reader let user choose... (chcek permissons in google doc)
        shareFileGoogle(file.id, email, 'writer', function() {
        });
    }
    //ITS REGULAR GOOGLE DRIVE FILE
    else {
        insertPermissionGoogle(file.id, email, 'user', 'writer', function () {
        });
    }
}

/**
 * Remove sharing file with user specified in #shareWithEmail field
 */
function stopShareFile() {
    var email = $('#shareWithEmail')[0].value + '@gmail.com';

    //ITS ENCRYPTED FILE
    if(file.title.indexOf('.sc') > -1) {
        stopShareingFileGoogle(file.id, email, function() {});
    }
    //ITS REGULAR GOOGLE DRIVE FILE
    else {

    }
}
