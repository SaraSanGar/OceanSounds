# Manual de uso
Este manual de uso ha sido desarrollado para guiar a los usuarios a través del funcionamiento
del proyecto final Plataforma WEB para la visualización y análisis de campa˜nas de
acústica pasiva con planeadores submarinos.

## 1.1. Iniciar la API
En primer lugar, se debe ejecutar el fichero de python en el que se encuentra la API. Esto
se puede realizar ejecutando el comando indicado en el Algorito:

python -u "c:\ Users \ saras \ Documents \ TFG \ Proyecto \ dataProcessing \ dataProcessing .py"

Una vez ejecutado el comando se debe esperar hasta que aparezca * Serving Flask app
’dataProcessing’.

## 1.2. Iniciar la aplicación web
Una vez iniciada la API se procede a inicializar la aplicación web para ello, hay que
ubicarse en la carpeta oceanSounds y ejecutar el comando mostrado en el algoritmo 1.2.
Cuando se ejecute saldrá un mensaje “Compiled successfully! You can now view project in
the browser.” y a continuacián, la direccián de la página web.
npm start

## 1.3. Uso de la aplicación web
Tras iniciar los dos proyectos se debe acceder a la dirección que proporciona React. Una
vez en la web hay una pantalla de selección de fichero.
![selector](https://github.com/SaraSanGar/OceanSounds/assets/91456877/a4ecc047-3c88-4076-aac1-1e945876ef2d)

Una vez seleccionado el fichero se encuentra la página principal con el mapa, los descriptores
y el gráfico interactivo.
![principal](https://github.com/SaraSanGar/OceanSounds/assets/91456877/1c57e7a6-5c7c-4d81-a632-25b5313db442)

Al lado del mapa hay un icono si se pulsa se puede cambiar el estilo de mapa.
La tabla de los descriptores tiene un desplegable que da la opción de cambiar el tipo de
etiqueta de datos.

Pulsando sobre el botón “Upload another file” se puede cambiar el fichero con el que se
está trabajando.
En cambio, si se pulsa en “Detailed view” se accede a la página de vista detallada.

![botones](https://github.com/SaraSanGar/OceanSounds/assets/91456877/9e3bac50-8c9c-4d6f-b777-fec470b92c2d)

En la vista detallada, aparece un selector para seleccionar la clip a visualizar. Una vez
seleccionado se puede interactuar con el mapa, consultar los descriptores o los gráficos.
![descarga (27)](https://github.com/SaraSanGar/OceanSounds/assets/91456877/e9bd1a57-13f4-4875-906e-7b8c127f62ce)

Existen tres botones en la parte superior para cambiar de clip.

![botonesDetallada](https://github.com/SaraSanGar/OceanSounds/assets/91456877/82e931d0-b51d-4c33-bd43-32e65ec7c09b)
