# DCU UTILS
DCU Utils es una extensión que permite facilitar la subida y migración de código y archivos a OCC.
Esta versión 4.0.0 representa una reinviención en su gran mayoria (No solo a nivel código, sino también a las funcionalidades presentadas). Por tal motivo, la documentación se presentará como si fuera la primera vez que se publica la extensión.

## NOTA:
Siempre que se haga referencia a un **WIDGET**, lo mismo aplica para *ELEMENTOS*, *SNIPPETS*, etc (A menos que se especifique lo contrario).

## FEATURES:
Esta extensión permite:
 - Descargar código de un ambiente de OCC
 - Actualizar código de widgets
 - Subir archivos
 - Subir componentes
 - Migrar archivos
 - Migrar componentes
 - Migrar Layouts
 - Crear Widgets
 - Extraer locales de los archivos de configuracion
 - Subir/Eliminar Third Party Files
 - Subir/Eliminar/Descargar SSEs

## Requisitos

- Node
- Design Code Utility >= 1.13.3


## Issues conocidos

Ninguno

## 4.0.0


### Configuraciones de la Extensión

#### NOTA:
Las configuraciones de la extensión pueden abarcar dos niveles:
 - User Settings: Configuraciónes que aplican de manera global a VSCode
 - Workspace Settings: Configuraciones que solo aplican al workspace donde se esta trabajando.

La recomendación que ofrecemos, es que las configuraciones generales, si aplica, se realicen a nivel de **User**. Por otro lado, las configuraciones de ambiente, deberían realizarse a nivel de **Workspace**.

Para configurar la extensión, nos dirigimos a su apartado dentro de las configuraciones de Visual Studio Code

![1 - Config](https://imgur.com/42xfXdh.gif)

### Lista de configuraciones

#### Configuraciones generales

| Configuración | Descripción         |Valor por defecto   |
| ------------- |:-------------:| :--------:|
| notifyActions        | Al ejecutar una acción, mostrará un mensaje informando el status de la misma.          |SOLO ERRORES        |
| notifyUpdates         | Informa al usuario las novedades de cada version         | PREGUNTAR         |
| enableSessionFileTracking|Habilita un nuevo log donde se registra la actividad del usuario | SI|


#### Configuraciones de DCU

|Configuración  |Descripción  |Valor por defecto  |
|---------|---------|---------|
|copyCommand     | Permite copiar el comando ejectuado, si el mismo da error        | SI        |
|updateAllInstances     | Al subir un archivo base, actualiza todas las instancias del mismo        | PREGUNTAR        |
|migrateConfigOnTransfer     | Al migrar un componente, también migrará las configuraciones del mismo        |PREGUNTAR         |
|useInternalFoldersOnGrab     | Al hacer un GRAB, limita la seleccion de carpetas a las que se encuentren abiertas en el workspace        |NO         |

#### Configuraciones de PLSU

|Configuración  |Descripción  |Valor por defecto  |
|---------|---------|---------|
|fetchLayouts     | Listará los layouts disponibles en el ambiente de origen        |   SI      |
|ignoreCommerceVersion     |  Se ignora la version de OCC al migrar Layouts       |    SI     |
|preserveMetadata     |  Al migrar un Layout, se evita modificar la metadata del mismo (solo funciona si 'fetchLayouts' esta activo)       |    SI     |

#### Configuraciones de CCW


|Configuración  |Descripción  |Valor por defecto  |
|---------|---------|---------|
|widgetLanguages     | Selecciona los idiomas que se utilizan al crear un widget        |  BÁSICOS       |

#### Configuraciones de SSE

|Configuración  |Descripción  |Valor por defecto  |
|---------|---------|---------|
|useZipName     |    Al subir una SSE, utilizar el nombre del archivo .zip como nombre de la SSE     | NO        |

#### Configuraciones de ThirdPartyFiles

|Configuración  |Descripción  |Valor por defecto  |
|---------|---------|---------|
|useFileName     |    Al subir una SSE, utilizar el nombre del archivo .zip como nombre de la SSE     | NO        |

#### Configuraciones de Ambientes

Todos los ambientes (DEV, TEST, STAGE, PROD) disponen de la siguiente configuración:

|Configuración  |Descripción  |
|---------|---------|
|enviromentUrl     | URL del ambiente        |
|key     |  APP_KEY del ambiente       |

### Caracteristicas

Las capacidades de esta extensión permiten desde subir un componente a OCC, hasta crear thirdPartyFiles o subir SSEs.
La gran mayoria de estos comando disponen de un acceso en la **botonera**, no obastente, tambien se disponibiliza un **menú contextual** para acceder a ellas desde el árbol de archivos. Por último, se agregaron *shortcuts* para ejecutar tareas con una determinada **combinación de teclas**. A continuación, se listan los comandos y la disponibilización de los mismos

- **UPDATE** (dcu -e)

|Botonera 						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![dcu -e](https://imgur.com/uoTRJHE.png) | ctrl+alt+e  | SI            |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre una carpeta o archivo

**ACCIÓN:** Actualiza el codigo de un componente. En caso de ejecutarse desde la botonera o el atajo, sin que haya un archivo abierto, se solicitará el nombre del componente a actualizar. Esto **NO** es case-sensitive y solo requiere el nombre del componente (Ya sea widget, elemento, theme, etc)

- **PUT FILE** (dcu -t)


|Botonera 						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![dcu -t](https://imgur.com/UDPaRik.png) |ctrl+alt+t   |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre un archivo

**ACCIÓN:** Sube un archivo a OCC

- **PUT FOLDER** (dcu -m)

|Botonera 						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![dcu -m](https://imgur.com/qPwQI8f.png) | ctrl+alt+m  |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre una carpeta

**ACCIÓN:** Sube un componente entero a OCC

- **TRANSFER FILE** (dcu -r)

|Botonera 						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![dcu -r](https://imgur.com/9RglphG.png) | ctrl+alt+r  |  SI           |

**ACCIÓN:** Migra un archivo a otros ambientes configurados de OCC

- **TRANSFER COMPONENT** (dcu -x)

|Botonera 						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![dcu -x](https://imgur.com/IegRIjC.png) | ctrl+alt+x  |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre una carpeta

**ACCIÓN:** Migra un componente a otros ambientes configurados de OCC. Si no existe, lo creará

---

**OTRAS UTILIDADES**
Las otras utilidades que ofrece la extensión se encuentran bajo el boton ***Más acciones*** (![more](https://imgur.com/RGQSrrR.png)).
Al clickear este boton, se listaran las tareas adicionales que se pueden ejecutar. Estas son:

- **GRAB** (dcu -g)

|Icono   						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![dcu -g](https://imgur.com/K5fH2OS.png) | ctrl+alt+g  |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre una carpeta

**ACCIÓN:** Descarga el código de OCC.
Al ejecutar la tarea desde el atajo o la botonera, se solicitará la carpeta donde descargar el código.
Si, por otro lado, se ejecuta desde el menú contextual, se utilizará la carpeta seleccionada como ruta para descargar el código.

- **MIGRAR LAYOUTS** (plsu)

|Icono   						           |Atajo        |Menú contextual|
|------------------------------------------|-------------|---------------|
| ![PLSU](https://imgur.com/WmfTIXD.png    |-            |  -            |


**ACCIÓN:** Permite migrar layouts entre ambientes. El único pre-requisito es que los widgets que los conforman hayan sido migrados previamente

- **CREAR WIDGET** (ccw)

|Icono   						           			|Atajo        |Menú contextual|
|---------------------------------------------------|-------------|---------------|
| ![Crear widget](https://imgur.com/sMD6GyG.png)    |ctrl+alt+w   |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre una carpeta

**ACCIÓN:** Permite crear un widget (con o sin elementos). Esta opcion crea el widget, limpia los locales, renombra y ajusta los archivos necesarios. Finalmente lo sube a OCC para que el mismo quede disponible


- **CREAR SNIPPETS**

|Icono   						           			|Atajo        |Menú contextual|
|---------------------------------------------------|-------------|---------------|
| ![Crear Snippets](https://imgur.com/r0bnTHz.png)  |-            |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre un archivo *"configMetadata.json"*

**ACCIÓN:** Dado un archivo de configuraciones, busca y extrae los locales definidos y los agrega a los archivos de *locales* disponibles

- **CREAR THIRD PARTY FILE**

|Icono   						           			  |Atajo        |Menú contextual|
|-----------------------------------------------------|-------------|---------------|
| ![Upload ThirdParty](https://imgur.com/v9dI6x2.png) |-            |  -            |

**ACCIÓN:** Permite subir thirPartyFiles a OCC. Asimismo, permite configurar en que carpeta se guarda el archivo y, si se quiere, para que sitios diponibilizarlo

- **ELIMINAR THIRD PARTY FILE**

|Icono   						           			  |Atajo        |Menú contextual|
|-----------------------------------------------------|-------------|---------------|
| ![Delete ThirdParty](https://imgur.com/5uyhNOr.png) |-            |  -            |


**ACCIÓN:** Permite eliminar thirdPartyFiles de OCC

- **DESCARGAR SSE**

|Icono   						           			  						   |Atajo        |Menú contextual|
|------------------------------------------------------------------------------|-------------|---------------|
| ![SSE](https://imgur.com/vD6d2h9) ![Download](https://imgur.com/K5fH2OS.png) |-            |  -            |

**ACCIÓN:** Permite descargar una SSE de un ambiente dado

- **SUBIR SSE**

|Icono   						           			  						  	 |Atajo        |Menú contextual|
|--------------------------------------------------------------------------------|-------------|---------------|
| ![SSE](https://imgur.com/vD6d2h9.png) ![Upload](https://imgur.com/4N7PNWP.png) |-            |  SI           |

**Condición para ver el menú contextual:** Se debe hacer click derecho sobre un archivo .zip

**ACCIÓN:** Permite subir una SSE de un ambiente dado

- **ELIMINAR SSE**

|Icono   						           			  						  	 |Atajo        |Menú contextual|
|--------------------------------------------------------------------------------|-------------|---------------|
| ![SSE](https://imgur.com/vD6d2h9.png) ![Delete](https://imgur.com/sANpxpx.png) |-            |  -            |

**ACCIÓN:** Permite eliminar una SSE de un ambiente dado


- **COPIAR KEY**

|Icono   						      		|Atajo        |Menú contextual|
|-------------------------------------------|-------------|---------------|
| ![CopyKey](https://imgur.com/rs9Xfhb.png) |-            |  -            |

**ACCIÓN:** Permite copiar al portapapeles la APP_KEY de un ambiente seleccionado

- **COPIAR URL**

|Icono   						      		 |Atajo        |Menú contextual|
|--------------------------------------------|-------------|---------------|
| ![CopyNode](https://imgur.com/bQy9oRd.png) |-            |  -            |

**ACCIÓN:** Permite copiar al portapapeles la URL de un ambiente seleccionado


---

## LISTADO DE ATAJOS


|COMANDO  |ATAJO  |
|---------|---------|
|occ.more | ctrl+alt+space|
|dcu.e | ctrl+alt+e|
|dcu.t | ctrl+alt+t|
|dcu.m | ctrl+alt+m|
|dcu.r | ctrl+alt+r|
|dcu.x | ctrl+alt+x|
|dcu.grab | ctrl+alt+g|
|ccw.w | ctrl+alt+w|

---

## LOG

Todas las acciones quedan registradas en una consola donde puede verse la información, advertencias y errores que hayan ocurrido.
Podemos encontrar el LOG en la sección **OUTPUT**, y luego buscamos *DCU INFO*
![4 - Output](https://imgur.com/27JaOMI.png)


Entre las mejoras al momento de generar el log, se incorporó una cabezera destacando la tarea ejecutada, una sección donde se visualiza el comando ejecutado y/o la configuración definida. Luego llega el respuesta de la tarea ejecutada. A diferencia de versiones previas, esta consola loggea en tiempo real la respuesta del servidor (Antes aparecia el log una vez finaliada la tarea).

---

## SNIPPETS

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

---

## CREACIÓN DE WORKSPACE

Mucha gente me pregunta ***"Que pasa si estoy trabajando en dos proyectos? Como configuro urls y keys para cada uno??***

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
