<div style="text-align: center; overflow-wrap: break-word; hyphens: auto;">
<h2 >Solving Complex Problems Through Clever Algorithms: Modelling Protein-Detergent Complexes (PDC)</h2>
</div>

<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
<p>Tackling any complex real-world problem often begins with breaking it down into smaller, manageable components, a lesson I learned from <strong>software engineering</strong>. This idiom can be applied to accurately modeling <a class="inline-link" href="https://www.sigmaaldrich.com/technical-documents/protocol/protein-biology/protein-purification/solubilization" target="_blank">protein–detergent complexes (PDCs)</a> for better analysis of <a class="inline-link" href="https://en.wikipedia.org/wiki/Small-angle_scattering" target="_blank">SAXS</a> data. This was no trivial matter; the inherent complexity in the geometry and physical chemistry required innovative computational solutions.</p>

<p>This project became an exercise in designing clever data structures, implementing geometric algorithms at scale, and combining them into a system that solves a high-impact structural biology task. Below, I'll walk through how I decomposed this complex problem into solvable modules, the algorithms I used, how I optimized their implementation, and how the pieces came together into a real-world modelling engine.</p>
</div>

<div style="display: flex; justify-content: center; margin: 0 0 2rem 0; flex-direction: column; align-items: center;">
    <div style="display: flex; justify-content: center; width: 100%; gap: 1rem;">
        <figure style="flex: 1; margin: 0; height: 0; padding-bottom: 38%; position: relative;">
            <img src="/images/pdc_all_atoms.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;">
        </figure>
        <figure style="flex: 1; margin: 0; height: 0; padding-bottom: 38%; position: relative;">
            <img src="/images/pdc_pa.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;">
        </figure>
    </div>
    <figcaption style="text-align: center; margin-top: 0.5rem;">
    <p>The first figure shows a detailed, all-atom model. Every atom of the protein and each detergent molecule is represented explicitly. while a fully atomistic approach is great to have physical detail, it can become prohibitively expensive and still may not exhaustively sample all relevant conformations within feasible compute time. <strong>This is non-ideal for machine learning practice.</strong></p>
    <p>By contrast, in a coarse-grained representation, pseudo atoms are used to represent the detergent molecules. This approach is far more efficient to compute, so it can more quickly produce a model that fits experimental data, <strong>ideal for machine learning practice.</strong> But there is <strong>a critical caveat</strong>: but the final model may not always reflect the underlying biochemistry of the protein–detergent system. The second figure shows a clear false-positive. Physically, the protein placement is not entirely correct as the hydrophobic region (grey) is not properly wrapped by the detergent corona.</p>
    </figcaption>
</div>

---

### Step-by-Step Problem Breakdown

To address the complexity effectively, I abstracted the original challenge into simpler, clearly-defined sub-problems:

**1. Biophysical Context Augmentation**

<div style="display: flex; justify-content: center;  margin: 1rem 0;">
  <figure style="margin: 0;">
    <img src="/images/pdc_pre.jpg" alt="reality" style="width: 50%; object-fit: cover; object-position: center  50% 50%;">
  </figure>
</div>
<div style="text-align: center;">
Geometry analysis and hydrophobic boundaries generation.
</div>
<br>

**2. Geometry Reconstruction of the Protein Envelope**

<div style="display: flex; justify-content: center; margin: 1rem 0;">
  <figure style="margin: 0;">
    <img src="/images/pdc_envlope.jpg" alt="reality" style="width: 50%; object-fit: cover; object-position: center  50% 50%;">
  </figure>
</div>
<div style="text-align: center;">
Determining the effective volume of the <a class="inline-link" href="https://en.wikipedia.org/wiki/Integral_membrane_protein" target="_blank">integral membrane protein</a> (<a class="inline-link" href="https://en.wikipedia.org/wiki/Integral_membrane_protein" target="_blank">IMP</a>) structure. The key is to find the geometric boundary of the IMP.
</div>
<br>

**3. Geometric Inclusion**

<div style="display: flex; justify-content: center; margin: 1rem 0;">
  <figure style="margin: 0;">
    <img src="/images/pdc_pluecker.jpg" alt="reality" style="width: 90%; object-fit: cover; object-position: center  50% 50%;">
  </figure>
</div>
<div style="text-align: center;">        
Efficiently deciding if a point (pseudo detergent molecule) is within the defined protein envelope.
</div>
<br>

**4. Constructing Detergent Corona**

<div style="display: flex; justify-content: center; margin: 1rem 0;">
  <figure style="margin: 0;">
      <img src="/images/pdc_corona.jpg" alt="reality" style="width: 80%; object-fit: cover; object-position: center  50% 50%;">
  </figure>
</div>
<div style="text-align: center;">
Forming a flexible representation of the detergent layer surrounding the protein. By varying the parameter of the pseudo atoms, we can control the shape and electron density of the detergent corona.
</div>
<br>

**5. Orientation Sampling**

<div style="display: flex; justify-content: center;margin: 1rem 0;">
  <figure style="margin: 0;">
    <img src="/images/pdc_so3.jpg" alt="reality" style="width: 100%; object-fit: cover; object-position: center  50% 50%;">
  </figure>
</div>
<div style="text-align: center; ">    
Systematically exploring different orientations of the protein–detergent complex to optimize the model.
</div>
<br>

---

### Algorithmic Solutions and Purpose

**Convex Hull Computation**

<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
To encapsulate the IMP, I employed a convex hull algorithm, effectively capturing the protein's geometric boundary. This provided a well-defined geometric envelope to simplify subsequent processing. The convex hull is a convex polyhedron that completely encloses the protein structure. It is the smallest convex shape that can contain the protein, and it is defined by its vertices. This is achieved by <a class="inline-link" href="https://www.qhull.org/" target="_blank">Qhull</a> algorithm.
</div>
<div style="display: flex; justify-content: center; margin: 2rem 0;">
  <figure style="margin: 0;">
    <img src="/images/hull.gif" alt="reality" style="width: 60%; object-fit: cover; object-position: center  50% 50%;">
    <figcaption style="text-align: center; margin-top: 0.5rem;">
    The IMP envelope constructed based on the convex hulls of the three regions.
    Overall the convex hulls form a concave shape.
  </figcaption>
  </figure>
</div>

**Ray-Triangle Intersection and Inclusion Testing**

<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
Determining whether individual detergent molecules belonged to the protein complex required a robust geometric inclusion test. I selected the <a class="inline-link" href="https://en.wikipedia.org/wiki/Ray_tracing_(graphics)" target="_blank">Ray-Triangle Intersection</a> test, using the <a class="inline-link" href="https://en.wikipedia.org/wiki/Pl%C3%BCcker_coordinates" target="_blank">Plücker-based method</a> for enhanced precision. The purpose was clear: accurately and quickly classify points relative to complex 3D surfaces.
</div>

<div style="display: flex; justify-content: center; margin: 1rem 0;">
  <figure style="margin: 0; position: relative;">
    <img src="/images/pdc_ray-intersect.png" alt="reality" style="width: 50%; object-fit: cover; object-position: center  50% 50%;">
    <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
      <!-- Red dot highlight -->
      <circle class="highlight-circle" cx="32%" cy="48%" r="8" fill="none" stroke="red" stroke-width="2" opacity="0" style="transition: opacity 0.3s ease;">
      </circle>
      <!-- Green dot highlight -->
      <circle class="highlight-circle" cx="49%" cy="36%" r="8" fill="none" stroke="green" stroke-width="2" opacity="0" style="transition: opacity 0.3s ease;">
      </circle>
    </svg>
    <figcaption style="text-align: center; margin-top: 0.5rem;">
    A two-dimensional demonstration of the ray-tracing method. A polygon boundary separates the points in the plane to its outside and inside. Shoot a ray from the tested point in an arbitrary direction. For each ray there is a crossing number (cn) of intersections. The <span class="dot-reference" data-dot="outside">outside points (red dot)</span> have a cn of even numbers; the <span class="dot-reference" data-dot="inside">inside points have a cn of odd numbers (green dot)</span>.
    </figcaption>
  </figure>
</div>
<br>

**SIMD-Accelerated Plücker-Based Inclusion Test**
<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
The <a class="inline-link" href="https://en.wikipedia.org/wiki/SIMD" target="_blank">SIMD</a>  accelerated inclusion test efficiently determines whether points lie within a complex protein boundary by representing triangles and rays using precomputed Plücker coordinates. These coordinates allow orientation checks via simple arithmetic operations (multiplications and additions), which can be parallelized using SIMD instructions, dramatically accelerating the computations. The implementation eliminates conditional branching through logical bitmask operations, optimizing CPU pipeline usage. Additionally, triangle data are stored compactly and memory-aligned to enhance cache efficiency and maximize computational throughput. Check out the <a class="inline-link" href="https://github.com/YunyunGao/DETPROT/blob/master/Hull.py" target="_blank">code</a> for more details.
</div>
<br>

**Coarse-Grained Detergent Corona and Orientation Grid Construction**
<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
Adapting a coarse-grained approach to simulate the detergent corona, which drastically simplified computations without sacrificing accuracy. An SO(3) grid facilitated systematic sampling of possible orientations, enhancing the thoroughness and reliability of the model optimization. Check out the <a class="inline-link" href="https://github.com/YunyunGao/DETPROT/blob/master/Sampler.py" target="_blank">orientation sampling code</a> for more details.
</div>
<br>

---

### Combining Algorithms for Real-World Problem
<div style="text-align: justify; overflow-wrap: break-word; hyphens: auto;">
<p>Efficiency was a top priority. By combining SIMD parallelization with precise geometric algorithms, my implementation drastically reduced runtime while maintaining high accuracy. Specifically, the SIMD-accelerated Plücker-based inclusion testing represented a major innovation, handling large datasets with ease and demonstrating my ability to creatively enhance existing algorithms for substantial performance gains.</p>
<p>Individually efficient, these algorithms together solved a critical real-world problem: accurate PDC modeling crucial for interpreting SAXS data. By linking geometric boundary definitions with highly optimized inclusion tests and orientation exploration, I constructed a robust computational pipeline. The resulting methodology can significantly improve structural biologists' understanding of membrane proteins, ultimately influencing drug discovery and biochemical research.</p>
</div>
<div style="display: flex; justify-content: center; margin: 2rem 0;">
  <figure style="margin: 0;">
    <img src="/images/pdc_results.png" alt="reality" style="width: 100%; object-fit: cover; object-position: center  50% 50%;">
    <figcaption style="text-align: center; margin-top: 0.5rem;">
    (Left) Example of the best-fitted PDC model for the outward-facing Mhp1 (PDB code: 2jln)
    and a DDM corona with an elliptic capsule-like shape. The shell layer and core layer are
    highlighted in blue and purple, respectively. A physiologically reasonable result is obtained. (Right) the fitting result of the best-fitted PDC model against the SAXS experimental data.
  </figcaption>
  </figure>
</div>

---

### Tech Stack & Technical Highlights
- Programming Languages: 
  - Python (data orchestration, model integration)
  - Cython (C extensions for performance-critical geometry routines)
  - C (SIMD implementation of Plücker inclusion tests)
  - NumPy / SciPy (numerical computation)   
  - Matplotlib + PyMol (visualization)

- Libraries and Frameworks:
  - Qhull geometric primitives (custom reimplementation)
  - OpenMP (parallelization of model evaluations)
  - Biopython (structure parsing)

- Technical Highlights:
  - Fast: Custom SIMD ray-triangle intersection engine
  - Efficient: SO(3) rotation sampling with Fibonacci lattice
  - Optimized: Efficient memory model for coarse-grained point cloud storage
  - Scalable: Works on large membrane proteins in the similar time as small ones


---

_This project was never about biology and SAXS alone. It was about thinking like an engineer—abstracting messy, ill-posed problems into clean computational components and using the right tools to make them work at scale. Whether in research or industry, the skill of building efficient, modular algorithms is the same. This work reflects how I tackle complexity: by breaking it down, building the right pieces, and making them work together to solve a real problem._

<style>
.highlight-dot {
  transition: all 0.3s ease;
}

.highlight-dot:hover {
  filter: brightness(1.5) drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
  cursor: pointer;
}

.dot-reference {
  cursor: pointer;
  text-decoration: underline;
}

.dot-reference[data-dot="outside"]:hover {
  color: red;
}

.dot-reference[data-dot="inside"]:hover {
  color: #4CAF50;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const dotReferences = document.querySelectorAll('.dot-reference');
  const highlights = document.querySelectorAll('.highlight-circle');
  
  dotReferences.forEach(reference => {
    reference.addEventListener('mouseenter', function() {
      const dotType = this.getAttribute('data-dot');
      const highlight = document.querySelector(`.highlight-circle:nth-child(${dotType === 'outside' ? 1 : 2})`);
      highlight.style.opacity = '1';
    });
    
    reference.addEventListener('mouseleave', function() {
      const dotType = this.getAttribute('data-dot');
      const highlight = document.querySelector(`.highlight-circle:nth-child(${dotType === 'outside' ? 1 : 2})`);
      highlight.style.opacity = '0';
    });
  });
});
</script>
