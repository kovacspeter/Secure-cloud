/**
 * Retrieve all chidrens of root folder. When finished for appends each children to html of where.
 * @param where element where drive content will be shown
 * @param folder folder(id) in drive to be shown
 */
function showMyDrive(where, folder) {
    getFolderChildren(folder, function (res) {
        var childrenList = res.items;
        var folderList = $('<ul></ul>');
        var fileList = $('<ul></ul>');
        var back = false;
        for (var i=0; i<childrenList.length; i++) {
            getFileMetadata(childrenList[i].id, function (resp) {
                if(!back && !resp.parents[0].isRoot) {
                    var fileInfo = $('<li></li>');
                    fileInfo.append("<a id='drive-back'><div class='google-folder'><img src='images/folder.png'>..</div></a>");
                    folderList.append(fileInfo);
                    $('#drive-back').click(function () {
                        getFileMetadata(resp.parents[0].id, function(r) {
                            showMyDrive('files', r.parents[0].id);
                        });
                    });
                    back = true;
                }
                var title = resp.title;
                var isFolder = false;
                if(resp.mimeType == "application/vnd.google-apps.folder") {
                    isFolder = true;
                }
                var fileInfo = $('<li></li>');
                if(isFolder) {
                    fileInfo.append("<a id=" + resp.id + "><div class='google-folder'><img src='images/folder.png'>" + title + "</div></a>");
                    folderList.append(fileInfo);
                    $('#' + resp.id).click(function () {
                        showMyDrive('files', resp.id);
                    });
                } else {
                    fileInfo.append("<a id=" + resp.id + "><div class='google-file'><img src='images/file.png'>" + title + "</div></a>");
                    fileList.append(fileInfo);
                    $('#' + resp.id).click(function () {
                        file = resp;
                        $('#downloadFile').attr('disabled', false);
                    });
                }
            });
        }

        $('#' + where).html(folderList);
        $('#' + where).append(fileList);
    })
}


/**
 * Uploads file from fileform to google drive storage
 */
function uploadFile() {
    if ($('input#uplFile')[0].files[0] != undefined){
        updateFileResumable({'title': $('input#uplFile')[0].files[0].name + '.sc'},$('input#uplFile')[0].files[0], function (uplResp) {
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

    downloadFileFromDrive(file, function (downResp) {
        if (downResp !== null) {
            saveData(downResp.data, downResp.title);
        }else {
            alert('Please select file by clicking on it');
        }
    });
}



