import './ckeditor.js'

export function createCKEditor(editorId, html, readonly, callbackFunc, dotNet) {
    ClassicEditor
        .create(document.getElementById(editorId), {
            // Editor configuration.
            removePlugins: ['Title', 'Markdown'],
            htmlSupport: {
                allow: [
                    {
                        name: /.*/,
                        attributes: true,
                        classes: true,
                        styles: true
                    }
                ]
            }
        })
        .then(editor => {
            editor.model.document.on('change:data', () => {
                let data = editor.getData();
                const el = document.createElement('div');
                el.innerHTML = data;
                if (el.innerText.trim() == '')
                    data = null;
                dotNet.invokeMethodAsync(callbackFunc, data);
            });
            if (html) {
                editor.setData(html);
            }
            if (readonly === true) {
                editor.enableReadOnlyMode(editorId)
            } else {
                editor.disableReadOnlyMode(editorId)
            }
            window.CKEditors = {};
            window.CKEditors[editorId] = editor;
        })
        .catch(handleSampleError);

    function handleSampleError(error) {
        const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

        const message = [
            'Oops, something went wrong!',
            `Please, report the following error on ${issueUrl} with the build id "vggebzcle01-nnnj6hhmgqvg" and the error stack trace:`
        ].join('\n');

        console.error(message);
        console.error(error);
    }
}

export function destroy(editorId) {
    if (window.CKEditors) {
        const editor = window.CKEditors[editorId];
        if (editor) {
            editor.destroy();
        }
    }
}
export function setReadonly(editorId, readonly) {
    if (window.CKEditors) {
        const editor = window.CKEditors[editorId];
        if (editor) {
            if (readonly === true) {
                editor.enableReadOnlyMode(editorId)
            } else {
                editor.disableReadOnlyMode(editorId)
            }
        }
    }
}