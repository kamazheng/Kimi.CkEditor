using Microsoft.Extensions.DependencyInjection;

namespace Kimi.CkEditor;

public static class ServiceRegister
{
    public static void UseKimiCkEditor(this IServiceCollection service)
    {
        service.AddScoped<KimiJsInterop>();
    }
}
