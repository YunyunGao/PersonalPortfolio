<link rel="stylesheet" href="../app/popup-polygon-editor.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<div style="text-align: center; overflow-wrap: break-word; hyphens: auto;">
<h2>Finding NEMOs: Weaving a Better Fishing Net with Statistics, Clustering, and Machine Learning</h2>
</div>

<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
Imagine you're exploring the vast ocean of scientific data. Among countless useful data points swimming around freely, there are sneaky creatures hiding quietly in the shadows. They look harmless, even normal, but they can cause significant issues if they're not caught early. In crystallography, we call these stealthy troublemakers "NEMOs"—Not-Excluded-unMasked-Outliers. My job was to catch them. 
</div>
Why Traditional Methods Couldn't Catch NEMO
In macromolecular X-ray crystallography, scientists collect diffraction patterns to determine the structures of proteins. Sometimes, however, parts of the detector called "beamstops" unintentionally block reflections, leaving behind weak outlier signals. Traditional statistics are good at identifying clearly anomalous data, but these NEMOs are subtle: they cluster quietly, hidden in the noisy low-resolution regions, easily escaping typical statistical filters.

Think of traditional statistics as fishing with a simple net: great for catching obvious, large fish, but these NEMOs are like tiny, stealthy fish slipping right through. Something smarter, subtler, and more adaptive was needed.

Designing a Better Net
To catch these elusive outliers, I needed a system that understood patterns and clusters intuitively. I decided to blend crystallographic statistics with a powerful clustering technique called Hierarchical Density-Based Clustering (HDBSCAN). The idea was straightforward: first, use crystallographic statistics to identify a set of suspect reflections, and second, let clustering algorithms find persistent groupings among these suspects.

Here was my game plan:

Data Preparation: Extracted relevant data points—specifically weak reflections—at low-resolution regions (where NEMOs tend to hide).

Initial Statistics Screening: Applied traditional crystallographic probability methods to identify potential outliers.

Clustering: Used HDBSCAN to identify clusters based on density—this is where patterns invisible to traditional methods emerge.

Teaching the Model to Fish: Semi-Supervised Machine Learning
Simply combining statistics and clustering wasn't enough. I needed to optimize this net so it didn't accidentally catch healthy data (false positives) or miss actual NEMOs (false negatives). This is where machine learning stepped in.

I took a semi-supervised learning approach:

Creating Ground Truth: I manually curated and verified a dataset by visually inspecting diffraction images and labeling genuine NEMOs. This step was crucial—careful data curation laid the groundwork for accurate model training.

Hyperparameter Optimization: I performed iterative optimization of the model's hyperparameters. Using techniques such as Monte Carlo sampling and Tree-structured Parzen Estimator (TPE), I tuned the algorithm until it reliably separated genuine NEMOs from healthy reflections across various conditions.

Validation and Performance Metrics: With carefully chosen metrics (precision, accuracy, sensitivity, and specificity), I continuously evaluated the model, ensuring it performed robustly even with challenging datasets.

This approach significantly improved the model's ability to differentiate true outliers from innocent bystanders, reducing both false alarms and overlooked NEMOs.

Weaving the Perfect Fishing Net: An Integrated Approach
The true strength of my solution wasn't just statistics, clustering, or machine learning individually—it was how seamlessly I integrated them. By first screening reflections statistically, then clustering based on density, and finally refining via semi-supervised learning, I created a comprehensive, adaptive net to reliably catch NEMOs.

Think of this as fishing smartly: using initial sonar (statistics) to detect likely areas, then casting an adaptive net (HDBSCAN), and finally adjusting this net’s size and shape (machine learning) based on continuous feedback from the environment.

Catching NEMOs in the Wild: Real-World Impact
The outcome was remarkable: not only did I successfully identify NEMOs, but my approach improved data quality, directly benefiting downstream scientific analyses. Importantly, the solution was built for easy integration into existing pipelines. Researchers can now automatically remove these hidden errors before structural refinement, ensuring clearer, more accurate scientific discoveries.




<div class="button-section">
    <button id="openEditor" class="btn">Open Polygon Editor</button>
</div>

<div id="polygonEditorPopup" class="popup-container">
    <div class="popup-content">
        <div class="editor-layout">
            <!-- Canvas Container -->
            <div class="canvas-container">
                <canvas id="canvas"></canvas>
            </div>
            <!-- Vertical Controls on the Right -->
            <div class="controls-container">
                <!-- Drawing Controls -->
                <div class="drawing-controls">
                    <button id="drawMask" class="control-button"><i class="fas fa-pen"></i> Draw Mask</button>
                    <button id="clearAll" class="control-button"><i class="fas fa-trash"></i> Clear All</button>
                </div>            
                <!-- Image Adjustment Controls -->
                <div class="image-controls">
                    <h3>Image Adjustments</h3>                
                    <div class="slider-control">
                        <label for="brightnessSlider">Brightness</label>
                        <div class="slider-container">
                            <input type="range" id="brightnessSlider" min="-1" max="1" step="0.01" value="0">
                            <span id="brightnessValue" class="value-display">0.00</span>
                        </div>
                    </div>                
                    <div class="slider-control">
                        <label for="contrastSlider">Contrast</label>
                        <div class="slider-container">
                            <input type="range" id="contrastSlider" min="-1" max="1" step="0.01" value="0">
                            <span id="contrastValue" class="value-display">0.00</span>
                        </div>
                    </div>                   
                    <div class="slider-control">
                        <label for="gammaSlider">Gamma</label>
                        <div class="slider-container">
                            <input type="range" id="gammaSlider" min="0.1" max="2.2" step="0.01" value="1">
                            <span id="gammaValue" class="value-display">1.00</span>
                        </div>
                    </div>
                </div>              
                <!-- Tips Section -->
                <div class="tips-section">
                    <h3>How to use</h3>
                    <ul>
                        <li>Click "Draw Mask" to start drawing beamstop mask</li>
                        <li>Close the polygon by double-clicking</li>
                        <li>Double-click on a mask to edit vertices</li>
                        <li>Single-click on a mask to transform</li>
                        <li>Click "Clear All" to clear all masks</li>
                        <li>Use the sliders to assist in drawing masks</li>
                    </ul>
                </div>
                <div>
                <div style="text-align: center;">
                    <button id="closeEditor" class="close-button"><i class="fas fa-times"> Close Window</i></button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Load Fabric.js library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
<!-- Load the core polygon editor functionality first -->
<script src="../app/polygon-editor-core.js"></script>
<!-- Then load the main popup script -->
<script src="../app/popup-polygon-editor.js"></script>
