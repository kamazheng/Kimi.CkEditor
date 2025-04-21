using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Kimi.CkEditor;

public partial class CkEditor : IAsyncDisposable
{
    [Inject]
    public KimiJsInterop JsInterop { get; set; } = null!;

    [Parameter]
    public bool IsReadonly { get; set; } = false;

    [Parameter]
    public bool IsFullScreen { get; set; } = false;

    private readonly string editorId = TagIdGenerator.Create();
    private readonly string kimiCkEditorDiv = TagIdGenerator.Create();

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            string funcName = nameof(this.EditorDataChanged)!;
            await JsInterop.createCkEditor(editorId, editorId, CurrentValue!, IsReadonly, funcName, DotNetObjectReference.Create(this));
            await JsInterop.SetCkEditorReadonly(editorId, IsReadonly);
            await JsInterop.SetAllSubElementsWithSameSelector(kimiCkEditorDiv);
            if (IsFullScreen)
            {
                await JsInterop.setNotScrollMaxHeightByClass("ck-editor__main", 0);
            }
        }
    }

    [JSInvokable]
    public Task EditorDataChanged(string data)
    {
        CurrentValue = data;
        StateHasChanged();
        return Task.CompletedTask;
    }

    public async ValueTask DisposeAsync()
    {
        await JsInterop.DisposeCkEditor(editorId);
    }
}