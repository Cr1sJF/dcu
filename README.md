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


## Known Issues

Ninguno, si codeo re piola

**NOTA:** Si encuentran alguno, no lo hagan público, me avisan por privado XP

## 1.0.0

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

## V1.0.1
Correccion sistema de notificiaciones

## 1.1.0
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

## 2.0.0
## Full renovación
Tal vez sea un poco brusco dar un salto tan grande de version al ver lo que incluye esta actualizacion, PERO por debajo se hizo una profunda reestructuracion del código. Sin embargo, ahi van las cosillas nuevas:

### Nuevo log
Implementamos una nueva estructura de log, con información mas clara y detallada respecto a su version previa:

![Log](https://imgur.com/vFMsVci.png)

1. Inicio bloque de Log
2. Inicia ejecución de tarea
3. Comando que se ejecuta
4. Información del status de la tarea
5. Respuesta de la tarea
6. Advertencias que arrojo la tarea
7. Si se produce un error, en vez de INFO y WARN se visualizará una seccion ERROR
8. Fin del bloque de Log

### Fusión de "Migrar layout" y "Migrar todos los layouts"
Ambas funcionalidades coexisten en un solo botón. Al momento de seleccionar el layout a migrar, puede ingresarse un * para migrarlos todos

![Migrar](https://imgur.com/vtVs4Zx.png)

### Actualización de SETTINGS
Se removieron los checks para activar o desactivar funcionalidades

### Nuevos iconos
Otra chucheria, cambie los iconos de "Migrar Layout" y "Actualizar Widget"


### 2.0.1

HotFix

### 2.0.2

HotFix (sorry)

### 2.0.3
Ups! Mala mia. No va a volver a pasar... esta semana...

## 2.1.0
### Tracking de archivos

Agregamos una nueva setting *"Hablitar seguimiento de archivos"*.
Al estar encendido este check, la extensión mantendra un tracking de los archivos con los que hayas interactuado desde que abris VS Code, hasta que lo cierres (o limpies la consola).

Dentro de la pestaña *OUTPUT* vas a encontrar una nueva consola, **DCU FILE TRACKING**, ahi verás reflejados los cambios que hagas


![FileTracking](https://imgur.com/OrWyUIR.png)

### Bugfix
Habia un error al intentar hacer GRAB de un ambiente, pero ya fue solucionado

## 2.1.1
Hot fix -_-


## 3.0.0

### Administracion de notificaciones
Puede ser medio cargoso el popup del VS Code, asi que ahora se puede configurar la frecuencia de los popups.

Ahora se disponibilizó una nueva configuración para ello.

![NotifSetting](https://imgur.com/PhhdAzr.png)

Si la configuración se setea en "SI", el comportamiento será igual al de siempre.
Si se setea en "NO", dejarán de mostrarse mensajes emergentes. De todos modos, persiste el log, el spinner sobre la acción y el resultado de la misma.

Si se setea en "SOLO ERRORES", solo se mostrarán notificaciónes cuando se produzca un error al ejectuar el comando.

**NOTA:** Esta configuración solo impacta en los mensajes al momento de ejecutar un comando, cualquier error previo (falta de configuracion, no hay archivos abiertos, etc.) se notificaran de todas formas.

### Menu contextual:
La actualización que da pie a la nueva versión de la extensión corresponde a un menú contextual (click derecho) sobre determinadas carpetas del código.

Las acciones que pueden ejecutarse desde este menú (Al hacer click derecho) son:

- GRAB          (dcu -g): Si se hace sobre una carpeta
- UPDATE        (dcu -e): Si se hace sobre una carpeta o archivo
- TRANSFER ALL  (dcu -x): Si se hace sobre una carpeta o archivo
- TRANSFER FILE (dcu -r): Si se hace sobre un archivo

![ContextFile](https://imgur.com/chpCgiG.png)
![ContextFolder](https://imgur.com/jZVp8T0.png)

Una vez seleccionada una acción, el procedimiento es exactamente igual que antes. La acción seleccionada comenzará a ejecutarse (spinner en la parte inferior derecha) y al finalizar indicara con un icono (y notificación) el estado de la misma.
Claro está que la acción persiste en el LOG.


### PUT de instancias mejorado
Se modificó la configuración sobre "Actualizar todas las instancias". Previamente era solo un check, es un selector.
Esto permite tener control sobre lo que sucede al subir un archivo.

![PutInstances](https://imgur.com/78SJ70b.png)

Opciones:

- NUNCA:                    Jamas se agrega el la opcion -i al subir un archivo a OCC
- PREGUNTAR:                El sistema determina si se modificó un archivo base y consultará si quieren actualizarse todas las intancias
- SOLO SI ES ARCHIVO BASE:  Cada vez que se suba un archivo base "instanciable" (template, less o locale) se agregará la opcion -i.


# IMPORTANTE

Mucha gente me pregunta (Mucha gente = Luis) ***"Que pasa si estoy trabajando en dos proyectos? Como configuro urls y keys para cada uno??***

Bueno, para ello, VS Code nos disponibiliza settings por **WORKSPACE**, por lo que es recomendable que, si eventualmente, se trabaja en dos proyectos, crear un workspace para cada uno

- ¿Cómo creo un workspace?
Fácil, abris una carpeta cualquierda donde vayasa a tener tu código en VS Code.

![AbrirCarpeta](https://imgur.com/S25UGr1.png)

Luego, clickeas en File -> Save workspace as... y le asignas un nombre (Podria ser el nombre del proyecto)

![GuardarWorkspace](https://imgur.com/v2o5h0o.png)

Una vez creado el workspace, tendrás acceso a el/los workspaces creados

![Workspaces](https://imgur.com/HSAZkPf.png)

- ¿Cómo cargo settings por workspace?
Al abrir un workspace, VS Code lo resaltará en las carpetas abiertas.
![OpenWorkspace](https://imgur.com/DiqAdTP.png)

- Nos dirigimos a File -> Preferences -> Settings (o al engranaje de abajo a la izquierda)
![OpenSettings](https://imgur.com/7fLLxrX.png)

- En la pestaña "Workspace" podremos configurar las settings para este ambiente determinado y, asi, tener credenciales distintas por proyecto
![WorkspaceSettings](https://imgur.com/2wz6Vap.png)

**NOTA:** Si no se configuran settings por workspace (O si no se utiliza un workspace),la extensión tomará las settings a nivel User



## Extension Settings

Si bien esta extensión posee muchas configuraciónes, no requiere mucho tiempo setear lo mínimo indispensable para su correcto funcionamiento

* `dcu.general`                                 : Aca se encuentran las configuraciones generales de la extension
    * `dcu.general.enableSessionFileTracking`   : Activa el log de archivos modificados
    * `dcu.general.ignoreCommerceVersion`       : Cuando esta opción este checkeada, se ignora la versión de OCC al momento de migrar layouts
    * `dcu.general.migrateConfigOnTransfer`     : Selecciona el comportamiento de las configuraciones del widget al migrar un widget entre ambientes.
    * `dcu.general.notifyActions`               : Configura las notificaciones cuando se ejecutan comandos
    * `dcu.general.notifyUpdates`               : Configura las notificaciones cuando la extension se actualice

* `dcu.[ENV]`                               : La extensión posee cuatro sub-secciones para configurar las credenciales de los ambientes (DEV, TEST, STAGE, PROD)
    * `enviromentUrl`                       : URL del ambiente asociado a la sección. **IMPORTANTE:** La url debe ser exactamente igual al formato https://XXXXXXXXENV-admin.occa.ocs.oraclecloud.com o https://ccadmin-ENV-XXXX.oracleoutsourcing.com (Finalizando en .com y no .com/)
    * `key`                                 : APP_KEY del ambiente asociado a esta sección