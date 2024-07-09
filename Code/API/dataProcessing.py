from flask import Flask, jsonify, request
import matplotlib.pyplot as plt
from datetime import datetime
from scipy import linalg
from scipy import signal
from scipy.signal import hilbert
from scipy.io import wavfile
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib
import threading
import base64
import io
import os

matplotlib.use('Agg')
app = Flask(__name__)
CORS(app)

fileName = None
startAudio = None
lock = threading.Lock() 

def fileDate():
    if "_clicks" in fileName:
        date = "Several dates"
    else:
        fileNameDate = datetime.strptime(fileName, "%Y%m%dT%H%M%SZ")
        date = fileNameDate.strftime("%d-%m-%Y")
    return date

def fileLabels():
    overview_df = pd.read_csv('./rawData/'+fileName+'.csv')
    if "_nl" in fileName:
        labels = ["All"]
    else:
        labels = overview_df['label'].unique().tolist()
    return labels

def fileStartAudio():
    global startAudio, fileName
    if not "_clicks" in fileName:
        overview_df = pd.read_csv('./rawData/'+fileName+'.csv')
        startAudio = overview_df.iloc[0]['begin[sec]']
    else:
        startAudio = 0

def detectFiles():
    files = []
    path = './rawData/'
    for element in os.listdir(path):
        nameElement = os.path.splitext(element)[0]
        files.append(nameElement)
    return files

def getDetectionData(detectionName):
    data = pd.read_csv('./rawData/'+fileName+'.csv')
    if isinstance(detectionName, int):
        detectionName = str(detectionName)
    filtered_data = data[data['Id'].astype(str).str.strip() == detectionName.strip()]
    deteccion_df = pd.DataFrame()
    if "_clicks" in fileName:
        all_descriptors = ['Id', 'state','energy_per[%]', 'RMS[kHz]', 'label','depth[m]', 'Qrms','lat[deg]', 'lon[deg]', 'date', 'time', 'cl_b[sec]', 'duration[usec]' ]
    else:    
        all_descriptors = ['Id', 'state','date', 'time', 'label','depth[m]', 'clip[usec]', 'begin[sec]' ,'msec','energy[%]', 'SNR[dB]','Fp[kHz]', 'Fc[kHz]', 'RMS[kHz]', 'Qrms', 'Fs[kHz]', 'slope_max_wvd', 'lat[deg]', 'lon[deg]']
    for descriptor in all_descriptors:
        if filtered_data[descriptor].empty:
            filtered_data[descriptor] = 0
        deteccion_df[descriptor] = filtered_data[descriptor]
        
    return deteccion_df

def rescaleAudio(data):
    max_val = np.max(data)
    min_val = np.min(data)

    epsilon = 1e-10
    normalized_data = 2 * (data - min_val) / (max_val - min_val + epsilon) - 1
    
    return normalized_data
  
def wigner_distribution(x, use_analytic=True, sample_frequency=None,
                        t_0=0, t_1=1, flip_frequency_range=True):
    """Discrete Pseudo Wigner Ville Distribution based on [1]

    Args:
        x, array like, signal input array of length N
        use_analytic, bool, whether or not to use analytic associate of input
            data x by default set to True
        sample_frequency, sampling frequency
        t_0, time at which the first sample was recorded
        t_1, time at which the last sample was recorded
        flip_frequency_range, flip the data in about the time axis such that
            the minimum frequency is in the left bottom corner.

    Returns:
        wigner_distribution, N x N matrix
        frequency_bins, array like, length N frequency range

    References:
        [1] T. Claasen & W. Mecklenbraeuker, The Wigner Distribution -- A Tool
        For Time-Frequency Signal Analysis, Phillips J. Res. 35, 276-300, 1980
    """

    # Ensure the input array is a np array
    if not isinstance(x, np.ndarray):
        x = np.asarray(x)
    # Compute the autocorrelation function matrix
    if x.ndim != 1:
        raise ValueError("Input data should be one dimensional time series.")
    # Use analytic associate if set to True
    if use_analytic:
        if all(np.isreal(x)):
            x = signal.hilbert(x)
        else:
            raise RuntimeError("Keyword 'use_analytic' set to True but signal"
                               " is of complex data type. The analytic signal"
                               " can only be computed if the input signal is"
                               " real valued.")

    # Calculate the wigner distribution
    N = x.shape[0]
    bins = np.arange(N)
    indices = linalg.hankel(bins, bins + N - (N % 2))

    padded_x = np.pad(x, (N, N), 'constant')
    wigner_integrand = \
        padded_x[indices+N] * np.conjugate(padded_x[indices[::, ::-1]])

    wigner_distribution = np.real(np.fft.fft(wigner_integrand, axis=1)).T

    # calculate sample frequency
    if sample_frequency is None:
        sample_frequency = N / (t_1 - t_0)

    # Calculate frequency range
    if use_analytic:
        max_frequency = sample_frequency/2
    else:
        max_frequency = sample_frequency/4

    # Flip the frequency range
    if flip_frequency_range:
        wigner_distribution = wigner_distribution[::-1, ::]

    return wigner_distribution, max_frequency

def generate_spectrogram(start_time, duration):
    with lock:
        try:
            sample_rate, data = wavfile.read('./wavData/' + fileName + '.wav')
        except FileNotFoundError:
            return "Error: Archivo no encontrado."
        except Exception as e:
            return f"Error al leer el archivo WAV: {e}"
        
        start_sample = int(start_time * sample_rate)
        end_sample = start_sample + int(duration * sample_rate)

        if start_sample < 0 or end_sample > len(data):
            raise ValueError("Intervalo de tiempo fuera de los límites del archivo de audio")

        data_segment = data[start_sample:end_sample]

        data_segment = rescaleAudio(data_segment)

        wigner_dist, max_freq = wigner_distribution(data_segment, sample_frequency=sample_rate, t_0=start_time, t_1=start_time + duration)
        max_amplitude = np.max(wigner_dist)
        min_amplitude = np.min(wigner_dist)
        center_amplitude = (max_amplitude + min_amplitude) / 2

        plt.figure(figsize=(10, 6))
        plt.imshow(wigner_dist, aspect='auto', extent=[start_time, start_time + duration, 0, max_freq], cmap='jet', vmin=center_amplitude - (max_amplitude - min_amplitude) / 2, vmax=center_amplitude + (max_amplitude - min_amplitude) / 2)
        plt.colorbar(label='Amplitude')
        plt.title('Wigner-Ville Distribution')
        plt.xlabel('Time (s)')
        plt.ylabel('Frequency (Hz)')
        plt.tight_layout()

        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='png')
        img_bytes.seek(0)

        img_base64 = base64.b64encode(img_bytes.read()).decode('utf-8')
        plt.close()

        return img_base64
     
def generate_audio_signal(start_time, duration):
    with lock:
        try:
            sample_rate, data = wavfile.read('./wavData/' + fileName + '.wav')
        except FileNotFoundError:
            return "Error: Archivo no encontrado."
        except Exception as e:
            return f"Error al leer el archivo WAV: {e}"

        start_sample = int(start_time * sample_rate)
        end_sample = start_sample + int(duration * sample_rate)

        if start_sample < 0 or end_sample > len(data):
            raise ValueError("Intervalo de tiempo fuera de los límites del archivo de audio")

        data_segment = data[start_sample:end_sample]

        data_segment = rescaleAudio(data_segment)
        
        time_axis = np.linspace(start_time, start_time + duration, len(data_segment))

        plt.figure(figsize=(10, 6))
        plt.plot(time_axis, data_segment)
        plt.title('Audio Signal')
        plt.xlabel('Time (sec)')
        plt.ylabel('Amplitude (rescaled)')
        plt.grid()

        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='png')
        img_bytes.seek(0) 

        img_base64 = base64.b64encode(img_bytes.read()).decode('utf-8')

        plt.close()
        return img_base64

def mapData(overview_df):
    map_df = pd.DataFrame()
    map_df['id'] = overview_df['Id']
    map_df['lat'] = overview_df['lat[deg]']
    map_df['lon'] = overview_df['lon[deg]']
    return map_df

def detectionsData(overview_df):
    deteccions_df = pd.DataFrame()
    deteccions_df['id'] = overview_df['Id']
    deteccions_df['label'] = overview_df['label']
    deteccions_df['depth'] = overview_df['depth[m]']
    return deteccions_df

def descriptorsData(overview_df):
    dfs_per_label = {}
    descriptors_columns = ['Descriptor', 'Mean', 'SD', 'Median', 'Percentile10', 'Percentile90']
    if "_clicks" in fileName:
        all_descriptors = ['energy[%]', 'RMS[kHz]', 'depth[m]', 'Qrms', 'duration[usec]']
        descriptors_df = pd.DataFrame(columns=descriptors_columns)
        for descriptor in all_descriptors:
            descriptor_data = [
                    descriptor, 
                    round(overview_df[descriptor].mean(), 2), 
                    round(overview_df[descriptor].std(), 2), 
                    round(overview_df[descriptor].median(), 2), 
                    round(overview_df[descriptor].quantile(.1), 2), 
                    round(overview_df[descriptor].quantile(.9), 2)
            ]
            descriptors_df.loc[len(descriptors_df)] = descriptor_data
            dfs_per_label["All"] = descriptors_df
    else:    
        all_descriptors = ['depth[m]', 'clip[usec]', 'msec', 'low_i', 'high_i', 'energy[%]', 'SNR[dB]','Fp[kHz]', 'Fc[kHz]', 'RMS[kHz]', 'Qrms', 'Fs[kHz]', 'slope_max_wvd']
        for label, group in overview_df.groupby('label'):
            descriptors_df = pd.DataFrame(columns=descriptors_columns)
            for descriptor in all_descriptors:
                descriptor_data = [descriptor, 
                                round(group[descriptor].mean(), 2), 
                                round(group[descriptor].std(), 2), 
                                round(group[descriptor].median(), 2), 
                                round(group[descriptor].quantile(.1), 2), 
                                round(group[descriptor].quantile(.9), 2)]
                descriptors_df.loc[len(descriptors_df)] = descriptor_data
            dfs_per_label[label] = descriptors_df
    return dfs_per_label

def processData(fileName):
    overview_df = pd.read_csv('./rawData/'+fileName+'.csv')
    os.mkdir('./processedData/processed'+fileName)

    maps_df = mapData(overview_df)
    maps_df.to_csv('./processedData/processed'+fileName+'/map_'+fileName+'.csv', index=False)

    deteccions_df = detectionsData(overview_df)
    deteccions_df.to_csv('./processedData/processed'+fileName+'/detecions_'+fileName+'.csv', index=False)

    dfs_per_label = descriptorsData(overview_df)
    for label in dfs_per_label:
        descriptors_df = dfs_per_label[label]
        descriptors_df.to_csv('./processedData/processed'+fileName+'/descriptors_'+fileName+label+'.csv', index=False)

def openMap(fileName):
    with open('./processedData/processed'+fileName+'/map_'+fileName+'.csv', 'r') as file:
        return file.read()
    
def openDetecions(fileName):
    with open('./processedData/processed'+fileName+'/detecions_'+fileName+'.csv', 'r') as file:
        return file.read()

def openDescriptors(fileName, label):
    with open('./processedData/processed'+fileName+'/descriptors_'+fileName+label+'.csv', 'r') as file:
        return file.read()

@app.route("/processedData/map")
def map_csv(): 
    map_csv = openMap(fileName)
    return jsonify(map_csv), 200

@app.route("/processedData/detecions")
def detecions_csv(): 
    deteccions_csv = openDetecions(fileName)
    labels = fileLabels()
    return jsonify(detections=deteccions_csv, labels=labels), 200

@app.route("/processedData/descriptors")
def descriptors_csv(): 
    descriptors_csv = ""
    label = request.args.get('label')
    if label !="":
        descriptors_csv = openDescriptors(fileName, label)
    return jsonify(descriptors_csv), 200

@app.route("/processedData/files")
def files(): 
    files = detectFiles()
    return jsonify(files), 200

@app.route("/processedDetection/all_detections")
def detections(): 
    global fileName
    data = pd.read_csv('./rawData/'+fileName+'.csv')
    detections_names = data['Id'].tolist()
    return jsonify(detections_names), 200

@app.route('/processedData/audio_signal', methods=['POST'])
def generate_audio_signal_endpoint():
    data = request.get_json()
    detection_data = data['detectionData'] 
    if "_clicks" in fileName:
        start_time = detection_data['cl_b[sec]']
        duration = detection_data['duration[usec]'] / 1000000 + 0.0007

    else:
        start_clip = detection_data['begin[sec]']
        start_time = start_clip - startAudio
        duration = detection_data['msec'] / 1000
    audio_signal_img = generate_audio_signal(start_time, duration)
    return jsonify(audio_signal_img=audio_signal_img)

@app.route('/processedData/spectrogram', methods=['POST'])
def generate_spectrogram_endpoint():
    data = request.get_json()
    detection_data = data['detectionData'] 
    if "_clicks" in fileName:
        start_time = detection_data['cl_b[sec]']
        duration = detection_data['duration[usec]'] / 1000000 + 0.0007
    else:
        start_clip = detection_data['begin[sec]']
        start_time = start_clip - startAudio
        duration = detection_data['msec'] / 1000
    spectrogram_img = generate_spectrogram(start_time, duration)
    return jsonify(spectrogram_img=spectrogram_img)

@app.route("/processedDetection", methods=['POST'])
def processed_detections():
    data = request.get_json()
    detectionName = data['detectionName']
    detectionData = getDetectionData(detectionName).to_dict(orient='records')[0]
    date = detectionData['date']
    time = detectionData['time']
    return jsonify(fileName=fileName, date=date, time=time, detectionData=detectionData), 200

@app.route("/processedData/", methods=['POST'])
def processed_data():
    global fileName
    global startAudio
    data = request.get_json()
    fileName = data['fileName']

    if not fileName:
        return jsonify(error="No se proporcionó ningún nombre de archivo."), 400

    date = fileDate()
    labels = fileLabels()
    fileStartAudio()

    if not os.path.exists('./processedData/processed' + fileName):
        print("Se han seleccionado datos sin procesar")
        processData(fileName)
    
    return jsonify(fileName=fileName, date=date, labels=labels), 200

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
