using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Kimi.CkEditor;

public partial class CkEditor : IAsyncDisposable
{
    [Inject]
    public KimiJsInterop JsInterop { get; set; } = null!;

    [Parameter]
    public bool IsReadonly { get; set; } = false;

    private string editorId { get; set; } = "kimi-ckeditor-8973";

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            string funcName = nameof(this.EditorDataChanged)!;
            await JsInterop.createCkEditor(editorId, editorId, CurrentValue!, IsReadonly, funcName, DotNetObjectReference.Create(this));
            await JsInterop.SetCkEditorReadonly(editorId, IsReadonly);
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