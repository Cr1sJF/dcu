# DCU UTILS
Bienvenido a la extension que solo un selecto grupo (porque somos pocos los que trabajamos en OCC) va a utilizar.
El propósito de esta extensión es facilitar el desarrollo y migración en OCC, facilitando la ejecución de comandos.

## Features
Estas son todas las acciones que pueden ejecutarse desde la botonera:


#### NOTA:
Siempre que se haga referencia a un **WIDGET**, lo mismo aplica para *ELEMENTOS*, *SNIPPETS*, etc (A menos que se especifique lo contrario).

- Descargar el código de un ambiente de OCC
- Actualizar un Widget
- Subir un archivo
- Subir un widget entero
- Mirar un archivo de un ambiente a otro
- Migrar un widget completo de un ambiente a otro
- Migrar un Layout
- Migrar todos los Layouts
## Requirements

- Node
- Design Code Utility > 1.13

## Extension Settings

Si bien esta extensión posee muchas configuraciónes, no requiere mucho tiempo setear lo mínimo indispensable para su correcto funcionamiento

* `dcu.general`                             : Aca se encuentran las configuraciones generales de la extension
    * `dcu.general.funciones`               : En esta sub-sección pueden activarse o desactivarse cada una de las funciones provistas
    * `dcu.general.updateAllInstances`      : Cuando esta opción este checkeada, al subir el archivo base de un widget, se actualizarán todas las instancias del mismo
    * `dcu.general.ignoreCommerceVersion`   : Cuando esta opción este checkeada, se ignora la versión de OCC al momento de migrar layouts
    * `dcu.general.migrateConfigOnTransfer` : Cuando esta opción este checkeada, al migrar un widget entre ambientes, tambien se migrará los valores de la configuración del mismo
    * `dcu.general.focusOnWarn`             : Cuando esta opción este checkeada, siempre que se produzca un **WARNING** en la consola, se hara foco sobre ella
    * `dcu.general.notifyUpdates`           : Configura las notificaciones cuando la extension se actualice

* `dcu.[ENV]`                               : La extensión posee cuatro sub-secciones para configurar las credenciales de los ambientes (DEV, TEST, STAGE, PROD)
    * `enviromentUrl`                       : URL del ambiente asociado a la sección. **IMPORTANTE:** La url debe ser exactamente igual al formato https://XXXXXXXXENV-admin.occa.ocs.oraclecloud.com o https://ccadmin-ENV-XXXX.oracleoutsourcing.com (Finalizando en .com y no .com/)
    * `key`                                 : APP_KEY del ambiente asociado a esta sección
## Known Issues

Ninguno, si codeo re piola

**NOTA:** Si encuentran alguno, no lo hagan público, me avisan por privado XP

## USO (V0.0.1):

1. En primer lugar, debemos configurar la extensión. Para ello nos dirigimos a su apartado dentro de las configuraciones de Visual Studio Code
![1 - Config](https://i.imgur.com/AXV9ANi.gif)

2. Todas las acciones poseen 3 estados **INICIADO**, **EXITOSO**, **FALLIDO**. Estos estados son reflejados y notificado mediante notificaciones:
    - Inicio de acción
    - Acción finalizada correctamente
    - Acción finalizada con error

![2.1 - Exito](https://i.imgur.com/199JvY8.gif)
![2.1 - Error](https://i.imgur.com/1igwRtP.gif)

3. Además, al ejecutar una acción, el icono de la misma pasa por los 3 estados previamente mencionados
    - Inicio

    ![3.1 - Inicio](https://i.imgur.com/eYD45rP.png)

    - Éxito

    ![3.2 - Éxito](https://i.imgur.com/BgzrILX.png)

    - Error
    
    ![3.3 - Error](https://i.imgur.com/jZyeIFX.png)
    

4. Como última fuente de información, todas las acciones quedan registradas en una consola donde puede verse la información, advertencias y errores que hayan ocurrido.
Podemos encontrar el LOG en la sección **OUTPUT**, y luego buscamos *DCU INFO*
![4 - Output](https://i.imgur.com/XJHSIac.gif)

5. Una vez configurado, podremos dar uso a la botonera de OCC, ubicada en la parte inferior derecha de VS Code
    **NOTA:** Muchas acciones tienen un comportamiento distinto si se tiene o no abierto un archivo de un Widget. Por ejemplo:
    - Si se quiere actualizar un widget con un archivo abierto, la extensión actualizará el widget abierto.
    ![5 - Con editor](https://i.imgur.com/zsAXpHW.gif)

    - Si no se abrió un editor, la extensión solicitará el nombre del componente que se quiere actualizar
    ![5 - Sin editor](https://i.imgur.com/Xcff9Pd.gif)

6. Para algunas acciones especiales, como la migración de Widgets, la extensión solicitará que se seleccione el ambiente de destino

![6 - Selector](https://i.imgur.com/NoXyjvh.gif)

## HOTFIX(V0.0.2)
Correccion sistema de notificiaciones

## USO(V0.0.3)
## Llegaron los Snippets!

Ahora, ademas de las funcionalidades ya existentes, se agregaron algunos atajos de teclado que van a facilitar el completado de algunos archivos de configuración

### ¿Como se usan?
Al igual que los snippets predefindos en VS Code, solo basta tipear algunna palabra clave y seleccionar el atajo deseado


### ¿Que atajos hay disponibles?
Actualmente, disponemos de atajos para 3 extensiones de archivos:

1. HTML: Atajos de KnockoutJS
![1 - HTML](https://i.imgur.com/8a2bGkO.gif)

- Lista de atajos disponibles:
    - if
    - foreach
    - with
    - data-bind
    - data-bind-if
    - data-bind-options

2. JS: Atajos de topics
![2 - JS](https://i.imgur.com/DjBdQCx.gif)

- Los atajos disponibles son:
    - Subcripcion a un TOPIC
    - Publicar un TOPIC

3. Config: Atajos para cargar configuraciones de un widget
![3 - config.json](https://i.imgur.com/fBgD6on.gif)

- Atajos disponibles para cargar configuraciones:
    - Estructura base de un archivo config.json
    - Setting de tipo **Section**
    - Setting de tipo **String**
    - Setting de tipo **Number**
    - Setting de tipo **Boolean**
    - Setting de tipo **Multiselect**
    - Setting de tipo **DropDown**
    - Setting de tipo **Option** (Funciona en conjunto con Multiselect/DropDown)
    - Setting de tipo **Media**
    - Setting de tipo **Collection**

4. Estructura del archivo ext.json (Cuando se crea un widget)
![4 - ext.json](https://i.imgur.com/wmDb4nv.gif)


