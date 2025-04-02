## Helcaraxe: Automated Detection of Ice Rings

<div style="text-align: justify;">
Helcaraxe is a machine learning project that automates the detection of <a class="inline-link" href="https://journals.iucr.org/d/issues/2021/04/00/tz5104/index.html">ice-crystal artifacts</a> (commonly known as ice rings) in macromolecular diffraction data. This project showcases practical problem solving using deep learning, data curation, and model integration, which are key skills in modern machine learning engineering.
</div>

&nbsp;

### A Bif of Project Background
<div style="text-align: justify;">
Diffraction data from protein crystallography can be contaminated by ice rings, which hinder accurate structure determination. Instead of delving into the underlying crystallographic science, Helcaraxe focuses on solving the detection challenge using machine learning. The project was implemented in Python with TensorFlow and Keras.
</div>

&nbsp;

---

## Data Curation and Preprocessing

### Curated Data Sources:  
<div style="text-align: justify;">
Datasets were annotated from established repositories and scientific collaborations. Features are extracted and standardized from raw data with the automated workflow.
 </div> 

<div style="display: flex; justify-content: center; gap: 20px; margin: 2rem 0;">
  <figure style="margin: 0; width: 100%;">
      <img src="/images/helcaraxe_data_curation.jpg?raw=true" alt="" style="width: 100%; height: auto; object-fit: cover;">
    <figcaption style="width: 100%;">
      Diffraction data converted into 2D histograms representing intensity versus resolution ranges. Histograms are normalized using TensorFlow's per-image standardization. This ensures a consistent input format for the neural network.
    </figcaption>
  </figure>
</div>


---


## Machine Learning Approach

**Model Architecture:**  
<div style="text-align: justify;">
  A shallow Convolutional Neural Network (CNN) with 1.5m parameters was designed. The network architecture is inspired by
architectures like <a class="inline-link" href="https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html">AlexNet</a> but uses fewer filters in the convolutional and parameters in the dense layers and is optimized for the specific task of binary classification.
</div>

<div style="display: flex; justify-content: center; gap: 20px; margin: 2rem 0;">
  <figure style="margin: 0; width: 100%;">
      <img src="/images/helcaraxe_cnn.JPG?raw=true" alt="" style="width: 100%; height: auto; object-fit: cover;">
    <figcaption style="width: 100%;">
      A schematic of the network architecture is presented where input dimensions are shown vertically, the convolutional filter sizes are depicted horizontally, and the dense layers display the number of units.
    </figcaption>
  </figure>
</div>
 

**Training & Optimization:**  
<div style="text-align: justify;">
<p>
During training, the <a class="inline-link" href="https://arxiv.org/abs/1805.07836">Binary Cross Entropy Loss function</a> was chosen for loss calculation, as it is well-suited for binary classification tasks. To address class imbalance, class weighting was applied, with weights determined by the sample distribution and then provided to TensorFlow to define the class weight. As a result, a misclassification of a histogram showing ice ring contamination contributes more to the loss than one without ice rings. Since the class weight alters the magnitude of the loss, optimizers that are sensitive to loss scale—such as the stochastic gradient optimizer—may fail. However, the selected optimizer for this model, <a class="inline-link" href="https://keras.io/api/optimizers/Nadam/">Nadam</a>, is not affected by these changes. 
</p>
<p>
The Hyperparameter tuning was conducted using the Hyperband algorithm for optimal performance. After the training and validation, SmoothGrad is for model interpretability. This reveals which parts of the input histograms most influence predictions.
</p>
</div>

<div style="display: flex; justify-content: center; gap: 20px; margin: 2rem 0;">
  <figure style="margin: 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
      <img src="/images/helcaraxe_smoothgrad.jpg?raw=true" alt="" style="width: 50%; height: auto; object-fit: cover;">
    <figcaption style="width: 70%;">
      <a class="inline-link" href="https://arxiv.org/abs/1706.03825">SmoothGrad</a> feature importance mask indicates that brighter pixels correspond to a higher relevance in the model's decision-making process. It is observed that the pixels at the bottom exhibit greater significance compared to those at the top or along the edges.
    </figcaption>
  </figure>
</div>

- **Performance Metrics:**  
  - Achieved over 97% accuracy and more than 95% precision.
  - Fast runtime (1–5 seconds per prediction) makes it suitable for real-time diagnostics.

---

## Tech Stacks

- **Deep Learning Frameworks**  
  - **TensorFlow & Keras:** For building, training, and deploying the CNN.
  
- **Programming & Data Handling**  
  - **Python:** Core language with libraries such as NumPy, Pandas, and SciPy.
  - **Visualization:** Matplotlib for plotting and visualizing data distributions and model insights.

- **Integration & Deployment**  
  - Designed to be integrated into existing analysis pipelines.
  - Flexible output that can be incorporated into broader software systems for real-time data quality control.

---

## Insights & Highlights

- **Practical Problem Solving**  
  Demonstrated how machine learning can be applied to a real-world problem by automating the detection of subtle artifacts in complex datasets.

- **Technical Proficiency**  
  Showcased expertise in data curation, neural network design, model optimization, and deployment using state-of-the-art deep learning libraries.

- **Impactful Integration**  
  The model not only improves detection performance compared to traditional methods but also integrates efficiently into existing scientific software environments.

- **Machine Learning & Deep Learning**  
  CNN design, training, evaluation, and interpretability.

- **Data Engineering**  
  Data collection, cleaning, and preprocessing.

- **Software Development**  
  Python programming with TensorFlow, Keras, NumPy, Pandas, and Matplotlib.

- **Model Deployment**  
  Integration of ML models into production-grade pipelines with real-time capabilities.

---

## Explore the Project

For more details about the model, check out the <a class="inline-link" href="https://github.com/YunyunGao/helcaraxe.git">HELCARAXE</a>. To try the trained model, visit <a class="inline-link" href="https://github.com/YunyunGao/AUSPEX.git">AUSPEX</a>.

---

*Helcaraxe exemplifies a practical approach to machine learning: solving a specific problem through effective data curation, custom neural network design, and seamless integration using modern deep learning frameworks.*