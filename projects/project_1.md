## Evaluate the Fidelity of SEC-SAXS Time Series

**TL;DR:** Polluted noisy time series can be rescued by a fidelity estimator (correctness-state score) without making subjective decision

**Result Showcasing:**

<div style="display: flex; justify-content: center; gap: 20px; margin: 2rem 0;">
  <figure style="margin: 0;">
    <img src="../images/denss_bad.webp" alt="gif bad" style="width: 320px; height: 250px; object-fit: cover; object-position: center  50% 50%;">
    <figcaption style="text-align: center; margin-top: 0.5rem;">Result with Bad Data</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="../images/denss_good.gif" alt="gif good" style="width: 320px; height: 250px; object-fit: cover; object-position: 50% 30%;">
    <figcaption style="text-align: center; margin-top: 0.5rem;">Result with Good Data</figcaption>
  </figure>
</div>

---

### Information Extraction is Hard because Subjectivite Decision

<div style="text-align: justify;">
  The <a class="inline-link" href="https://en.wikipedia.org/wiki/Biological_small-angle_scattering">solution SAXS</a> pattern of a molecule is inherently ambiguous due
  to its isotropic nature. Although several general parameters can be obtained through rigorous analytical
  interpretation of SAXS data, the correctness of the interpretation is largely affected by the basic data characteristics, such as accuracy of the background subtraction,
  evaluation of the structure factor (i.e polydispersity and intermolecular interactions),
  assessment of the meaningful data range, and estimation of the appearance of radiation
  damage. Because the SAXS profile lacks correlated measured outputs, it is
  hard to statistically provide an objective assessment of these crucial data qualities. A common
  situation for the SAXS user is that data interpretation can only be performed in an ill-posed
  manner, meaning the solution is not unique or the solution procedure is unstable. Consequently, the
  assessment of data quality is in fact a measurement of solution stability. Unfortunately, the stability criteria themselves also include subjective judgement, since many solutions lack an objective standard, and there is no clear dividing line between "many" and "too many".

In modern synchrotron bio-SAXS experiments in-line chromatography has been introduced
to separate the often complex mixtures that occur in these samples, for example, the mixture
of protein-detergent complexes, oligomers and empty micelles/vesicles that occur even in
well behaved membrane protein samples. By separating any potential contaminants and
different components of mixtures (conformational or compositional) using a chromatographic
column, chromatography-SAXS facilitates ideality and weak mono-dispersion of the
biological particles under study. When sample is delivered through a SEC coumn, it is called SEC-SAXS.

</div>

<div style="display: flex; justify-content: center; gap: 20px; margin: 2rem 0;">
  <figure style="margin: 0;">
    <img src="../images/sec_saxs.png" alt="sec saxs" style="width: 100%; object-fit: cover; object-position: center  50% 50%;">
    <figcaption>
      Dataset from <a class="inline-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6276278/">SEC-SAXS</a> are 2D time series (technically 3D, but azimuthal integration can be used to reduce the dimensionality). The sample is delivered to the X-ray beam using an HPLC system, and when the sample reaches the beam, the response appears at a predefined <a class="inline-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4420545/">Shannon channel</a> (or wave vector bin). Under ideal conditions, the time series at all Shannon channels resemble Gaussian distributions. Given the observed signal (I<sub>s+b</sub>), the background (I<sub>b</sub>) can be easily inferred.
    </figcaption>
  </figure>
</div>

---

### The Harsh Reality

<div style="text-align: justify;">
However, in reality, ideal conditions do not exist. In actual experiments, various issues arise. For example, flux turbulence can cause sudden changes in total signal. HPLC stability may be poor, alternating between fast and slow pumping. Additionally, overlapping species can complicate the analysis.
</div>
<div style="display: flex; justify-content: center; gap: 20px; margin: 1rem 0;">
  <figure style="margin: 0;">
    <img src="../images/sec_saxs_reality.webp" alt="reality" style="width: 100%; object-fit: cover; object-position: center  50% 50%;">
    <figcaption>
      This is the actual dataset. I don't even know where the protein peak is. Image the protein signal is a series of A and the background is a series of C. Many factors can affect the accurate evaluation of A series and C series.
    </figcaption>
  </figure>
</div>

---

### A Solution: Use Conjugate Prior experimentally determined

<div style="text-align: justify;">
 The chromatographic signal is normally a measurement of a certain molecular property, such as refractive index, light scattering, or UV absorption. The SAXS elution trace is a measurement of the total X-ray scattering of the sample and its surrounding environment (buffer, sample capillary). It is important to realize that the chromatographic signal and the SAXS signal are essentially two correlated time series. The chromatographic signal and the SAXS trace in the same experiment both respond to the sample concentration and are hence correlated. As long as the weak monodispersity and non-interaction assumptions hold, the resulting background-corrected time series of the SAXS intensity at each Shannon channel is semantically similar to the chromatographic signal. This can be used as a conjugate prior to help objectively remove I<sub>b</sub> from the SAXS time series. 
</div>

<div style="display: flex; justify-content: center; gap: 20px; margin: 1rem 0; width: 110%;">
  <figure style="margin: 0;">
      <img src="../images/sec_uv_saxs.png" alt="sec-uv-saxs" style="width: 100%; height: auto; object-fit: cover; clip-path: inset(0% 10% 0% 0%); transform: translateX(1%); /* Shift left to center the visible portion */">
    <figcaption>
      The figure shows the configuration of the SEC-UV-SAXS system and the corresponding data. Here the UV absorbance at 280nm serves as a robust reference time series because UV light is much less intrusive to proteins than X-ray. UV absorbance is proportional to the protein molar concentration. In solution SAXS, the signal from protein alone (I<sub>s</sub>) is also propotional to the protein molar concentration under dilute solution condition condition.
    </figcaption>
  </figure>
</div>

---

### Some Machine Learning Tricks

<div style="text-align: justify;">
After constructing the fidelity estimator correctness-state score (CSS), a similarity and metric learning approach is used to maximize the similarity between the reference signal and the SAXS signal in each Shannon channel.
</div>

<div style="display: flex; justify-content: center; gap: 20px; margin: 1rem 0;">
  <figure style="margin: 0; width: 60%;">
      <img src="../images/score_shannon.webp?raw=true" alt="score" style="width: 100%; height: auto; object-fit: cover;">
    <figcaption style="width: 190%; transform: translateX(-20%);">
      The top row shows the results obtained using the machine learning approach. The scattering signals in the region of interest are kept stable across all Shannon channels. The quality of the manifested time series remains above the baseline. The bottom two rows show the results using the traditional buffer background correction approach.     
    </figcaption>
  </figure>
</div>

<div style="display: flex; justify-content: center; gap: 20px; margin: 2rem 0;">
  <figure style="margin: 0;">
    <img src="../images/tim_original.png" alt="time series bad" style="width: 100%; height: auto; object-fit: cover;">
    <figcaption style="text-align: center; margin-top: 0.5rem;">Standard "Badly" Corrected Data</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="../images/tim_corrected.png" alt="time series good" style="width: 100%; height: auto; object-fit: cover;">
    <figcaption style="text-align: center; margin-top: 0.5rem;">Predicted Optimally Corrected Data</figcaption>
  </figure>
</div>

<div style="text-align: justify;">
The example presented here demonstrates that the optimized correction successfully account for the
<a class="inline-link" href="https://journals.iucr.org/d/issues/2010/04/00/ba5150/index.html">
radiation-induced changes</a>. The 2D time series of the optimal correction shows a significant improvement
against the standard correction. The post-processed SAXS profile obtained using
this optimized correction results in the "good" electron density distribution model shown at the beginning.
</div>

&nbsp;

---

## Tech Stacks

- **Machine Learning Frameworks:**
  - **Scikit-learn & Optuna:** For training and parameter optimization.
- **Programming & Data Handling:**

  - **Python:** Core language with datadistance (python wrapper)
  - **Data Processing:** Pyfai for pattern data integration. Structured vector data format designed to utilize Numpy vectorized computing.

- **Graphic Interface**
  - GUI made with PyQt. Real-time plot update with FigureCavas.

---

## Insights & Highlights

- **Robust Data Quality Enhancement**  
  Developed a novel metric (CSS) and a self-adaptive background correction method that objectively evaluate and improve the quality of noisy, time-series data.

- **Algorithm Development & Optimization**  
  Demonstrated expertise in creating iterative algorithms, leveraging techniques such as derivative warping distance and cost analysis to refine data processing.

- **Advanced Statistical & Error Analysis**  
  Applied statistical error estimation and robust validation methods on both synthetic and real-world datasets to ensure reliable outcomes.

- **Versatile Data Processing**  
  Showcased the ability to handle complex, noisy time series with scalable, automated solutions, reflecting a strong proficiency in developing and implementing customized data pipelines.

- **Problem-Solving & Innovation**  
  Combined technical rigor with innovative algorithm design to overcome challenges in data fidelity, highlighting strong analytical and programming skills applicable across data-intensive environments.

---

## Explore the Project

For more details about the project, check out the <a class="inline-link" href="https://github.com/PearsonCUI/CSSGUI">CSS</a>.

_This project not only provides a robust, objective metric for assessing SAXS data quality but also enhances data processing via machine learning. These innovations lead to more reliable structural interpretations and a reduction in subjective decision-making during SAXS data analysis._
