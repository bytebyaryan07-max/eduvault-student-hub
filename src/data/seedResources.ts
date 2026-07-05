import { EducationalResource } from "../types";

export const SEED_RESOURCES: EducationalResource[] = [
  {
    id: "res-dsa-notes",
    title: "Data Structures & Algorithms - Complete Notes",
    description: "Handwritten master notes for DSA. Covers Arrays, Linked Lists, Stacks, Queues, Binary Trees, Graphs, and Dynamic Programming with code snippets in C++ and Java.",
    fileType: "text",
    fileUrl: "",
    category: "Notes",
    subject: "Computer Science",
    course: "BTech / BCA",
    college: "Delhi Technological University (DTU)",
    year: "2nd Year",
    uploadedBy: "system-seed",
    uploadedByName: "Aarav Sharma",
    uploadedAt: "2026-06-20T10:00:00Z",
    downloadCount: 142,
    likesCount: 56,
    isApproved: true,
    content: `# Data Structures & Algorithms - Handwritten Master Notes

## 1. Complexity Analysis
Time Complexity: How execution time grows relative to input size $n$.
Space Complexity: Extra memory used by the algorithm.

### Common Notations
- **Big O ($O$):** Upper bound (worst case).
- **Omega ($\Omega$):** Lower bound (best case).
- **Theta ($\Theta$):** Tight bound (average case).

---

## 2. Linked Lists
A linear data structure where elements are not stored in contiguous memory locations. Each element (node) contains a data field and a reference (link) to the next node.

\`\`\`cpp
struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};
\`\`\`

### Operations:
- **Insertion at head:** $O(1)$
- **Searching:** $O(n)$
- **Deletion:** $O(n)$

---

## 3. Dynamic Programming (DP)
An algorithmic paradigm that solves a given complex problem by breaking it into subproblems, storing the results of subproblems to avoid computing them again (memoization).

### Classic Example: Fibonacci Sequence
- **Recursive (Naive):** $O(2^n)$
- **DP with Memoization:** $O(n)$
`
  },
  {
    id: "res-maths3-pyq",
    title: "Engineering Mathematics III - Dec 2024 End Sem Paper",
    description: "Previous Year End-Semester Question Paper for Engineering Maths III (Fourier Series, Laplace Transforms, and Partial Differential Equations). Solutions included.",
    fileType: "pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    category: "Previous Year Question Paper",
    subject: "Mathematics",
    course: "BTech",
    college: "Mumbai University (MU)",
    year: "2nd Year",
    uploadedBy: "system-seed",
    uploadedByName: "Priya Patel",
    uploadedAt: "2026-06-25T14:30:00Z",
    downloadCount: 89,
    likesCount: 32,
    isApproved: true,
    content: `# Mumbai University - End Semester Exam (Dec 2024)
## Subject: Engineering Mathematics III (B.Tech - All Streams)

### Section A (Compulsory - 20 Marks)
1. Find the Laplace transform of $e^{-3t} \sin(4t)$.
2. State the Dirichlet's conditions for a Fourier series expansion.
3. Solve the PDE: $\frac{\partial^2 z}{\partial x^2} - 4\frac{\partial^2 z}{\partial y^2} = 0$.

### Section B (Attempt any 3 - 60 Marks)
4. (a) Obtain the Fourier series for $f(x) = x^2$ in the interval $(-\pi, \pi)$. (10 Marks)
   (b) Using Laplace transforms, solve the differential equation:
   $\frac{d^2y}{dt^2} + 4y = \sin(t)$ with $y(0) = 0, y'(0) = 1$. (10 Marks)
`
  },
  {
    id: "res-dbms-lab",
    title: "Database Management Systems (DBMS) Lab Manual",
    description: "Complete practical manual containing 12 experiments. Covers SQL queries, DDl/DML, Joins, Triggers, PL/SQL blocks, and E-R Diagram design patterns.",
    fileType: "text",
    fileUrl: "",
    category: "Lab Manual",
    subject: "Computer Science",
    course: "BCA / BSc IT",
    college: "Guru Gobind Singh Indraprastha University (GGSIPU)",
    year: "2nd Year",
    uploadedBy: "system-seed",
    uploadedByName: "Amit Verma",
    uploadedAt: "2026-07-01T09:15:00Z",
    downloadCount: 210,
    likesCount: 88,
    isApproved: true,
    content: `# Database Management Systems Lab Manual

## Experiment 1: DDL Commands
Objective: To create, alter, drop, and truncate tables in SQL.

\`\`\`sql
CREATE TABLE Students (
    StudentID INT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50),
    Email VARCHAR(100) UNIQUE,
    EnrollDate DATE
);
\`\`\`

## Experiment 2: DML & SQL Joins
Objective: Querying data using Inner, Left, Right, and Full Outer joins.

\`\`\`sql
SELECT s.FirstName, c.CourseName, e.Grade
FROM Students s
INNER JOIN Enrollments e ON s.StudentID = e.StudentID
INNER JOIN Courses c ON e.CourseID = c.CourseID;
\`\`\`

## Experiment 3: Triggers in PL/SQL
Objective: Design an audit trigger to log changes to the Marks table.
`
  },
  {
    id: "res-polity-upsc",
    title: "Indian Polity Summary - Laxmikanth 6th Edition Notes",
    description: "Extremely concise chapter-by-chapter handwritten revision notes for UPSC CSE aspirants. Covers Fundamental Rights, DPSP, Parliament, and Judiciary.",
    fileType: "text",
    fileUrl: "",
    category: "Study Material",
    subject: "Indian Polity",
    course: "UPSC / Civil Services",
    college: "Drishti IAS / Vajiram",
    year: "Competitive",
    uploadedBy: "system-seed",
    uploadedByName: "Rohan Deshmukh",
    uploadedAt: "2026-07-03T18:40:00Z",
    downloadCount: 345,
    likesCount: 154,
    isApproved: true,
    content: `# Indian Polity - Quick Revision Notes
## Reference: M. Laxmikanth (6th Edition)

### Chapter 1: Historical Background
- **Regulating Act of 1773**: First step by British Gov to control East India Company. Designated Governor of Bengal as 'Governor-General of Bengal'.
- **Pitts India Act of 1784**: Distinguished commercial and political functions. Created Board of Control.
- **Indian Independence Act of 1947**: Declared India sovereign. abolished office of Viceroy.

---

### Chapter 7: Fundamental Rights (Part III, Article 12-35)
Borrowed from the US Constitution (Bill of Rights).
1. **Right to Equality** (Art. 14-18)
2. **Right to Freedom** (Art. 19-22)
3. **Right against Exploitation** (Art. 23-24)
4. **Right to Freedom of Religion** (Art. 25-28)
5. **Cultural & Educational Rights** (Art. 29-30)
6. **Right to Constitutional Remedies** (Art. 32) - Called the 'Heart and Soul' of Constitution by Dr. B.R. Ambedkar.
`
  },
  {
    id: "res-physics-12",
    title: "Class 12 Physics - Electrostatics & Current Electricity",
    description: "Detailed derivations and short-cut formulas for board exam preparation. Includes CBSE previous year solved numericals and diagrams.",
    fileType: "text",
    fileUrl: "",
    category: "Notes",
    subject: "Physics",
    course: "Class 12",
    college: "Kendriya Vidyalaya (KV)",
    year: "Class 12",
    uploadedBy: "system-seed",
    uploadedByName: "Neha Sen",
    uploadedAt: "2026-07-04T11:20:00Z",
    downloadCount: 74,
    likesCount: 29,
    isApproved: true,
    content: `# CBSE Class 12 Physics: Electrostatics Notes

## 1. Coulomb's Law
The electrostatic force of attraction or repulsion between two point charges is directly proportional to the product of charges and inversely proportional to the square of the distance between them.

$$F = k \cdot \frac{q_1 \cdot q_2}{r^2}$$

where $k = \frac{1}{4\pi\varepsilon_0} \approx 9 \times 10^9 \text{ N m}^2/\text{C}^2$.

---

## 2. Gauss's Law
The total electric flux through a closed surface is equal to $1/\varepsilon_0$ times the total charge enclosed inside the surface.

$$\oint E \cdot dAs = \frac{q_{\text{enclosed}}}{\varepsilon_0}$$

---

## 3. Formulas Cheat-sheet
- **Electric Potential:** $V = \frac{W}{q}$
- **Capacitance of Parallel Plate:** $C = \frac{\varepsilon_0 A}{d}$
- **Ohm's Law:** $V = I \cdot R$
`
  }
];
