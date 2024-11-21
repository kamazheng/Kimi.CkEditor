using Microsoft.JSInterop;

namespace Kimi.CkEditor
{
    // This class provides an example of how JavaScript functionality can be wrapped in a .NET class
    // for easy consumption. The associated JavaScript module is loaded on demand when first needed.
    //
    // This class can be registered as scoped DI service and then injected into Blazor components
    // for use.

    public class KimiJsInterop : IAsyncDisposable
    {
        private readonly Lazy<Task<IJSObjectReference>> kimiTask;
        private readonly Lazy<Task<IJSObjectReference>> threeTask;
        private readonly Lazy<Task<IJSObjectReference>> stepTask;
        private readonly Lazy<Task<IJSObjectReference>> ckEditorTask;
        private IJSRuntime jsRuntime;

        public KimiJsInterop(IJSRuntime jsRuntime)
        {
            this.jsRuntime = jsRuntime;
            kimiTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./_content/Kimi.CkEditor/kimi.js").AsTask());
            ckEditorTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./_content/Kimi.CkEditor/blazorCkEditor.js").AsTask());
            threeTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./_content/Kimi.CkEditor/blazorThreeJs.js").AsTask());

            stepTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./_content/Kimi.CkEditor/blazorStep.js").AsTask());
        }

        public async ValueTask show3dContent(string divId, string file)
        {
            var three = await threeTask.Value;
            await three.InvokeVoidAsync("show3dContent", new object[] { divId, file });
        }

        public async ValueTask showStepContent(string divId, string file)
        {
            var step = await stepTask.Value;
            await step.InvokeVoidAsync("showStepContent", new object[] { divId, file });
        }

        public async ValueTask createCkEditor(string editorId, string containerId, string html, bool isReadonly, string callbackFunc, object dotNet)
        {
            var module = await ckEditorTask.Value;
            await module.InvokeVoidAsync("createCKEditor", new object[] { editorId, html, isReadonly, callbackFunc, dotNet });
            await SetAllSubElementsWithSameSelector(containerId);
        }

        public async ValueTask DisposeCkEditor(string editorId)
        {
            var module = await ckEditorTask.Value;
            await module.InvokeVoidAsync("destroy", new object[] { editorId });
        }

        public async ValueTask SetCkEditorReadonly(string editorId, bool isReadonly)
        {
            var module = await ckEditorTask.Value;
            await module.InvokeVoidAsync("setReadonly", new object[] { editorId, isReadonly });
        }

        public async ValueTask setCkEditorHtml(string html)
        {
            await jsRuntime.InvokeVoidAsync("editor.setData", new object[] { html });
        }

        public async ValueTask SaveAsFile(string fileName, byte[] fileByte)
        {
            var module = await kimiTask.Value;
            var basw64str = Convert.ToBase64String(fileByte);
            await module.InvokeAsync<string>("saveAsFile", new object[] { fileName, basw64str });
        }

        public async ValueTask setNotScrollMaxHeight(string id, int desiredMargin)
        {
            var module = await kimiTask.Value;
            await module.InvokeAsync<string>("setNotScrollMaxHeight", new object[] { id, desiredMargin });
        }

        public async ValueTask setNotScrollMaxHeightByClass(string className, int desiredMargin)
        {
            var module = await kimiTask.Value;
            await module.InvokeAsync<string>("setNotScrollMaxHeightByClass", new object[] { className, desiredMargin });
        }

        public async ValueTask setDivReadonlyByDivId(string id, bool isReadOnly)
        {
            var module = await kimiTask.Value;
            await module.InvokeAsync<string>("setDivReadOnlyByDivId", new object[] { id, isReadOnly });
        }

        public async ValueTask setDivReadonlyByDivClassName(string divClassName, bool isReadOnly)
        {
            var module = await kimiTask.Value;
            await module.InvokeAsync<string>("setDivReadOnlyByDivClassName", new object[] { divClassName, isReadOnly });
        }

        public async ValueTask removeDiv(string divId)
        {
            var module = await kimiTask.Value;
            await module.InvokeAsync<string>("removeDiv", new object[] { divId });
        }

        public async ValueTask SetAllSubElementsWithSameSelector(string divId)
        {
            var module = await kimiTask.Value;
            await module.InvokeAsync<string>("setAllSubElementsWithSameSelector", new object[] { divId });
        }

        public async ValueTask DisposeAsync()
        {
            if (kimiTask.IsValueCreated)
            {
                var module = await kimiTask.Value;
                await module.DisposeAsync();
            }
            if (threeTask.IsValueCreated)
            {
                var module = await threeTask.Value;
                await module.DisposeAsync();
            }
            if (ckEditorTask.IsValueCreated)
            {
                var module = await ckEditorTask.Value;
                await module.DisposeAsync();
            }
        }
    }
}