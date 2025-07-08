# Script para agregar etiqueta "number" a archivos JSON de himnos
# Extrae el número del nombre del archivo y lo agrega como campo "number"

param(
    [string]$CarpetaHimnos = "src/assets/himnos/letra"
)

function Extraer-NumeroArchivo {
    param([string]$NombreArchivo)
    
    # Patrón para extraer números al principio del nombre del archivo
    if ($NombreArchivo -match '^(\d+)') {
        return $matches[1]
    }
    return $null
}

function Formatear-Numero {
    param([string]$Numero)
    
    # Formatea el número con tres cifras (ej: "74" -> "074")
    return $Numero.PadLeft(3, '0')
}

function Procesar-ArchivoHimno {
    param([string]$RutaArchivo)
    
    try {
        # Extraer número del nombre del archivo
        $numeroArchivo = Extraer-NumeroArchivo (Split-Path $RutaArchivo -Leaf)
        if (-not $numeroArchivo) {
            Write-Host "⚠️  $(Split-Path $RutaArchivo -Leaf): No se pudo extraer número del nombre" -ForegroundColor Yellow
            return $false
        }
        
        # Leer el archivo JSON
        $contenido = Get-Content $RutaArchivo -Encoding UTF8 -Raw
        $data = $contenido | ConvertFrom-Json
        
        # Verificar si ya tiene la etiqueta "number"
        $numeroFormateado = Formatear-Numero $numeroArchivo
        
        if ($data.PSObject.Properties.Name -contains 'number') {
            $numeroExistente = $data.number
            
            if ($numeroExistente -eq $numeroFormateado) {
                Write-Host "ℹ️  $(Split-Path $RutaArchivo -Leaf): Ya tiene number correcto - '$numeroFormateado'" -ForegroundColor Cyan
                return $false
            } else {
                Write-Host "⚠️  $(Split-Path $RutaArchivo -Leaf): Tiene number diferente - '$numeroExistente' → '$numeroFormateado'" -ForegroundColor Yellow
            }
        }
        
        # Agregar o actualizar la etiqueta "number"
        $data | Add-Member -MemberType NoteProperty -Name "number" -Value $numeroFormateado -Force
        
        # Guardar el archivo
        $data | ConvertTo-Json -Depth 10 | Set-Content $RutaArchivo -Encoding UTF8
        
        if ($data.PSObject.Properties.Name -contains 'number' -and $data.number -ne $numeroFormateado) {
            Write-Host "✅ $(Split-Path $RutaArchivo -Leaf): Number actualizado '$($data.number)' → '$numeroFormateado'" -ForegroundColor Green
        } else {
            Write-Host "✅ $(Split-Path $RutaArchivo -Leaf): Number agregado - '$numeroFormateado'" -ForegroundColor Green
        }
        
        return $true
        
    } catch {
        Write-Host "❌ $(Split-Path $RutaArchivo -Leaf): Error - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función principal
function Main {
    # Verificar que la carpeta existe
    if (-not (Test-Path $CarpetaHimnos)) {
        Write-Host "❌ La carpeta $CarpetaHimnos no existe" -ForegroundColor Red
        return
    }
    
    Write-Host "🎵 Iniciando agregado de etiqueta 'number' a himnos..." -ForegroundColor Magenta
    Write-Host "📁 Carpeta: $(Resolve-Path $CarpetaHimnos)" -ForegroundColor Magenta
    Write-Host ("-" * 60) -ForegroundColor Gray
    
    # Contadores
    $archivosProcesados = 0
    $archivosModificados = 0
    $archivosConError = 0
    
    # Procesar todos los archivos JSON
    $archivos = Get-ChildItem $CarpetaHimnos -Filter "*.json"
    
    foreach ($archivo in $archivos) {
        $archivosProcesados++
        
        if (Procesar-ArchivoHimno $archivo.FullName) {
            $archivosModificados++
        } else {
            $archivosConError++
        }
    }
    
    # Resumen final
    Write-Host ("-" * 60) -ForegroundColor Gray
    Write-Host "📊 RESUMEN:" -ForegroundColor White
    Write-Host "   Archivos procesados: $archivosProcesados" -ForegroundColor White
    Write-Host "   Archivos modificados: $archivosModificados" -ForegroundColor Green
    Write-Host "   Archivos sin cambios: $($archivosProcesados - $archivosModificados - $archivosConError)" -ForegroundColor Cyan
    Write-Host "   Archivos con error: $archivosConError" -ForegroundColor Red
    
    if ($archivosModificados -gt 0) {
        Write-Host "`n✅ ¡Proceso completado! $archivosModificados archivos fueron modificados." -ForegroundColor Green
    } else {
        Write-Host "`nℹ️  No se encontraron archivos que necesiten modificación." -ForegroundColor Cyan
    }
}

# Ejecutar el script
Main 