/**
 * Seeds all 4 question banks with full questions.
 * Run: node src/utils/seedQuestionBanks.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');

const BANKS = [
  {
    name: 'Arrays and Strings',
    description: 'Classic array manipulation and string processing problems',
    questions: [
      {
        type: 'coding',
        title: 'Reverse a String',
        statement: `## Reverse a String\n\nGiven a string \`s\`, return the string reversed.\n\n### Examples\n- Input: \`"hello"\` → Output: \`"olleh"\`\n- Input: \`"world"\` → Output: \`"dlrow"\``,
        marks: 10,
        difficulty: 'easy',
        group: 'Arrays and Strings',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `def reverse_string(s):\n    # Write your code here\n    return ""\n\ns = input()\nprint(reverse_string(s))` },
          { language: 'javascript', version: '*', code: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\n// Write your code here\n` },
          { language: 'java', version: '*', code: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Write your code here\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    // Write your code here\n    return 0;\n}` },
        ],
        testCases: [
          { input: 'hello', expectedOutput: 'olleh', isHidden: false, points: 1 },
          { input: 'world', expectedOutput: 'dlrow', isHidden: false, points: 1 },
          { input: 'racecar', expectedOutput: 'racecar', isHidden: true, points: 2 },
          { input: 'abcdefghijklmnop', expectedOutput: 'ponmlkjihgfedcba', isHidden: true, points: 3 },
        ],
      },
      {
        type: 'coding',
        title: 'Two Sum',
        statement: `## Two Sum\n\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\nAssume exactly one solution exists. Return indices as space-separated values on one line.\n\n### Input Format\n- Line 1: space-separated integers (the array)\n- Line 2: target integer\n\n### Examples\n- nums=[2,7,11,15], target=9 → "0 1"\n- nums=[3,2,4], target=6 → "1 2"`,
        marks: 20,
        difficulty: 'medium',
        group: 'Arrays and Strings',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `nums = list(map(int, input().split()))\ntarget = int(input())\n\n# Your code here\nseen = {}\nfor i, n in enumerate(nums):\n    if target - n in seen:\n        print(seen[target-n], i)\n        break\n    seen[n] = i` },
          { language: 'javascript', version: '*', code: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = lines[0].split(' ').map(Number);\nconst target = Number(lines[1]);\nconst seen = {};\nfor (let i = 0; i < nums.length; i++) {\n  const comp = target - nums[i];\n  if (seen[comp] !== undefined) { console.log(seen[comp] + ' ' + i); break; }\n  seen[nums[i]] = i;\n}` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] parts = sc.nextLine().split(" ");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        int target = sc.nextInt();\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (seen.containsKey(comp)) { System.out.println(seen.get(comp) + " " + i); return; }\n            seen.put(nums[i], i);\n        }\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <unordered_map>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> nums;\n    string line; getline(cin, line);\n    istringstream ss(line); int x;\n    while (ss >> x) nums.push_back(x);\n    int target; cin >> target;\n    unordered_map<int,int> seen;\n    for (int i = 0; i < nums.size(); i++) {\n        int c = target - nums[i];\n        if (seen.count(c)) { cout << seen[c] << " " << i; return 0; }\n        seen[nums[i]] = i;\n    }\n}` },
        ],
        testCases: [
          { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false, points: 2 },
          { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false, points: 2 },
          { input: '1 5 3 7 9\n12', expectedOutput: '2 4', isHidden: true, points: 4 },
          { input: '0 4 3 0\n0', expectedOutput: '0 3', isHidden: true, points: 4 },
        ],
      },
      {
        type: 'coding',
        title: 'Maximum Subarray Sum',
        statement: `## Maximum Subarray Sum (Kadane's Algorithm)\n\nGiven an integer array, find the contiguous subarray with the largest sum and return its sum.\n\n### Input\nSpace-separated integers on one line.\n\n### Examples\n- Input: \`-2 1 -3 4 -1 2 1 -5 4\` → Output: \`6\` (subarray [4,-1,2,1])`,
        marks: 20,
        difficulty: 'medium',
        group: 'Arrays and Strings',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `nums = list(map(int, input().split()))\n\n# Kadane's algorithm\nmax_sum = nums[0]\ncurrent = nums[0]\nfor n in nums[1:]:\n    current = max(n, current + n)\n    max_sum = max(max_sum, current)\nprint(max_sum)` },
          { language: 'javascript', version: '*', code: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\nlet maxSum = nums[0], current = nums[0];\nfor (let i = 1; i < nums.length; i++) {\n  current = Math.max(nums[i], current + nums[i]);\n  maxSum = Math.max(maxSum, current);\n}\nconsole.log(maxSum);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] p = sc.nextLine().split(" ");\n        int[] nums = new int[p.length];\n        for (int i = 0; i < p.length; i++) nums[i] = Integer.parseInt(p[i]);\n        int max = nums[0], cur = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            cur = Math.max(nums[i], cur + nums[i]);\n            max = Math.max(max, cur);\n        }\n        System.out.println(max);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    vector<int> v; int x;\n    while (cin >> x) v.push_back(x);\n    int maxSum = v[0], cur = v[0];\n    for (int i = 1; i < v.size(); i++) {\n        cur = max(v[i], cur + v[i]);\n        maxSum = max(maxSum, cur);\n    }\n    cout << maxSum;\n}` },
        ],
        testCases: [
          { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false, points: 2 },
          { input: '1', expectedOutput: '1', isHidden: false, points: 2 },
          { input: '-1 -2 -3', expectedOutput: '-1', isHidden: true, points: 4 },
          { input: '5 -3 5', expectedOutput: '7', isHidden: true, points: 4 },
        ],
      },
      {
        type: 'coding',
        title: 'Longest Substring Without Repeating Characters',
        statement: `## Longest Substring Without Repeating Characters\n\nGiven a string, find the length of the longest substring without repeating characters.\n\n### Examples\n- Input: \`"abcabcbb"\` → Output: \`3\` (substring "abc")\n- Input: \`"bbbbb"\` → Output: \`1\``,
        marks: 30,
        difficulty: 'hard',
        group: 'Arrays and Strings',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `s = input()\ncharSet = set()\nl = 0\nresult = 0\nfor r in range(len(s)):\n    while s[r] in charSet:\n        charSet.remove(s[l])\n        l += 1\n    charSet.add(s[r])\n    result = max(result, r - l + 1)\nprint(result)` },
          { language: 'javascript', version: '*', code: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconst set = new Set();\nlet l = 0, result = 0;\nfor (let r = 0; r < s.length; r++) {\n  while (set.has(s[r])) { set.delete(s[l++]); }\n  set.add(s[r]);\n  result = Math.max(result, r - l + 1);\n}\nconsole.log(result);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        Set<Character> set = new HashSet<>();\n        int l = 0, result = 0;\n        for (int r = 0; r < s.length(); r++) {\n            while (set.contains(s.charAt(r))) set.remove(s.charAt(l++));\n            set.add(s.charAt(r));\n            result = Math.max(result, r - l + 1);\n        }\n        System.out.println(result);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main() {\n    string s; cin >> s;\n    unordered_set<char> st;\n    int l = 0, res = 0;\n    for (int r = 0; r < s.size(); r++) {\n        while (st.count(s[r])) st.erase(s[l++]);\n        st.insert(s[r]); res = max(res, r - l + 1);\n    }\n    cout << res;\n}` },
        ],
        testCases: [
          { input: 'abcabcbb', expectedOutput: '3', isHidden: false, points: 3 },
          { input: 'bbbbb', expectedOutput: '1', isHidden: false, points: 3 },
          { input: 'pwwkew', expectedOutput: '3', isHidden: true, points: 5 },
          { input: '', expectedOutput: '0', isHidden: true, points: 5 },
        ],
      },
    ],
  },
  {
    name: 'Sorting and Searching',
    description: 'Binary search, sorting algorithms, and search problems',
    questions: [
      {
        type: 'coding',
        title: 'Binary Search',
        statement: `## Binary Search\n\nGiven a sorted array of integers and a target, return the index of target. If not found, return -1.\n\n### Input\n- Line 1: space-separated sorted integers\n- Line 2: target integer\n\n### Examples\n- nums=[1,3,5,7,9], target=7 → 3\n- nums=[1,2,3], target=4 → -1`,
        marks: 10,
        difficulty: 'easy',
        group: 'Sorting and Searching',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `nums = list(map(int, input().split()))\ntarget = int(input())\nl, r = 0, len(nums) - 1\nresult = -1\nwhile l <= r:\n    mid = (l + r) // 2\n    if nums[mid] == target:\n        result = mid; break\n    elif nums[mid] < target: l = mid + 1\n    else: r = mid - 1\nprint(result)` },
          { language: 'javascript', version: '*', code: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = lines[0].split(' ').map(Number);\nconst target = Number(lines[1]);\nlet l = 0, r = nums.length - 1, result = -1;\nwhile (l <= r) {\n  const mid = Math.floor((l + r) / 2);\n  if (nums[mid] === target) { result = mid; break; }\n  else if (nums[mid] < target) l = mid + 1;\n  else r = mid - 1;\n}\nconsole.log(result);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] p = sc.nextLine().split(" ");\n        int[] nums = Arrays.stream(p).mapToInt(Integer::parseInt).toArray();\n        int target = sc.nextInt();\n        int l = 0, r = nums.length - 1, result = -1;\n        while (l <= r) {\n            int mid = (l + r) / 2;\n            if (nums[mid] == target) { result = mid; break; }\n            else if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        System.out.println(result);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> v; int x;\n    string line; getline(cin, line);\n    istringstream ss(line);\n    while (ss >> x) v.push_back(x);\n    int target; cin >> target;\n    int l = 0, r = v.size()-1, res = -1;\n    while (l <= r) {\n        int mid = (l+r)/2;\n        if (v[mid]==target){res=mid;break;}\n        else if(v[mid]<target) l=mid+1;\n        else r=mid-1;\n    }\n    cout << res;\n}` },
        ],
        testCases: [
          { input: '1 3 5 7 9\n7', expectedOutput: '3', isHidden: false, points: 2 },
          { input: '1 2 3\n4', expectedOutput: '-1', isHidden: false, points: 2 },
          { input: '-10 -5 0 5 10 15\n0', expectedOutput: '2', isHidden: true, points: 3 },
          { input: '1\n1', expectedOutput: '0', isHidden: true, points: 3 },
        ],
      },
      {
        type: 'coding',
        title: 'Count Occurrences in Sorted Array',
        statement: `## Count Occurrences in Sorted Array\n\nGiven a sorted array and a target, count how many times target appears.\nUse binary search for O(log n) solution.\n\n### Input\n- Line 1: space-separated sorted integers\n- Line 2: target integer`,
        marks: 15,
        difficulty: 'medium',
        group: 'Sorting and Searching',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `import bisect\nnums = list(map(int, input().split()))\ntarget = int(input())\nleft = bisect.bisect_left(nums, target)\nright = bisect.bisect_right(nums, target)\nprint(right - left)` },
          { language: 'javascript', version: '*', code: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = lines[0].split(' ').map(Number);\nconst target = Number(lines[1]);\nfunction lower(t) { let l=0,r=nums.length; while(l<r){let m=(l+r)>>1; if(nums[m]<t)l=m+1; else r=m;} return l; }\nconsole.log(lower(target+1) - lower(target));` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    static int[] nums;\n    static int lower(int t) { int l=0,r=nums.length; while(l<r){int m=(l+r)/2;if(nums[m]<t)l=m+1;else r=m;} return l; }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        nums = Arrays.stream(sc.nextLine().split(" ")).mapToInt(Integer::parseInt).toArray();\n        int target = sc.nextInt();\n        System.out.println(lower(target+1) - lower(target));\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    vector<int> v; int x; string line; getline(cin,line);\n    istringstream ss(line); while(ss>>x) v.push_back(x);\n    int t; cin>>t;\n    cout << upper_bound(v.begin(),v.end(),t) - lower_bound(v.begin(),v.end(),t);\n}` },
        ],
        testCases: [
          { input: '1 2 2 3 3 3 4\n3', expectedOutput: '3', isHidden: false, points: 3 },
          { input: '1 1 1 1 1\n1', expectedOutput: '5', isHidden: false, points: 3 },
          { input: '1 2 3 4 5\n6', expectedOutput: '0', isHidden: true, points: 5 },
          { input: '5 5 5 5 5 5 5\n5', expectedOutput: '7', isHidden: true, points: 5 },
        ],
      },
      {
        type: 'coding',
        title: 'Merge Two Sorted Arrays',
        statement: `## Merge Two Sorted Arrays\n\nGiven two sorted arrays, merge them into one sorted array and print it.\n\n### Input\n- Line 1: space-separated integers (first sorted array)\n- Line 2: space-separated integers (second sorted array)\n\n### Output\nSpace-separated merged sorted integers.`,
        marks: 15,
        difficulty: 'easy',
        group: 'Sorting and Searching',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `a = list(map(int, input().split()))\nb = list(map(int, input().split()))\nresult = []\ni = j = 0\nwhile i < len(a) and j < len(b):\n    if a[i] <= b[j]: result.append(a[i]); i += 1\n    else: result.append(b[j]); j += 1\nresult.extend(a[i:]); result.extend(b[j:])\nprint(*result)` },
          { language: 'javascript', version: '*', code: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst a = lines[0].split(' ').map(Number);\nconst b = lines[1].split(' ').map(Number);\nconst result = [];\nlet i = 0, j = 0;\nwhile (i < a.length && j < b.length) {\n  if (a[i] <= b[j]) result.push(a[i++]); else result.push(b[j++]);\n}\nresult.push(...a.slice(i), ...b.slice(j));\nconsole.log(result.join(' '));` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] a = Arrays.stream(sc.nextLine().split(" ")).mapToInt(Integer::parseInt).toArray();\n        int[] b = Arrays.stream(sc.nextLine().split(" ")).mapToInt(Integer::parseInt).toArray();\n        List<Integer> res = new ArrayList<>();\n        int i=0,j=0;\n        while(i<a.length&&j<b.length){if(a[i]<=b[j])res.add(a[i++]);else res.add(b[j++]);}\n        while(i<a.length)res.add(a[i++]); while(j<b.length)res.add(b[j++]);\n        StringBuilder sb = new StringBuilder();\n        for(int k=0;k<res.size();k++){if(k>0)sb.append(' ');sb.append(res.get(k));}\n        System.out.println(sb);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n    string l1,l2; getline(cin,l1); getline(cin,l2);\n    vector<int> a,b; int x;\n    istringstream s1(l1); while(s1>>x) a.push_back(x);\n    istringstream s2(l2); while(s2>>x) b.push_back(x);\n    int i=0,j=0; bool first=true;\n    while(i<a.size()&&j<b.size()){\n        if(!first) cout<<' '; first=false;\n        if(a[i]<=b[j]) cout<<a[i++]; else cout<<b[j++];\n    }\n    while(i<a.size()){if(!first)cout<<' ';first=false;cout<<a[i++];}\n    while(j<b.size()){if(!first)cout<<' ';first=false;cout<<b[j++];}\n}` },
        ],
        testCases: [
          { input: '1 3 5\n2 4 6', expectedOutput: '1 2 3 4 5 6', isHidden: false, points: 3 },
          { input: '1 2\n3 4', expectedOutput: '1 2 3 4', isHidden: false, points: 3 },
          { input: '0 0 0\n0 0', expectedOutput: '0 0 0 0 0', isHidden: true, points: 5 },
          { input: '-5 -3 -1\n-4 -2 0', expectedOutput: '-5 -4 -3 -2 -1 0', isHidden: true, points: 5 },
        ],
      },
      {
        type: 'coding',
        title: 'Kth Largest Element',
        statement: `## Kth Largest Element\n\nGiven an array of integers and an integer k, find the kth largest element.\n\n### Input\n- Line 1: space-separated integers\n- Line 2: k (1-indexed)\n\n### Examples\n- nums=[3,2,1,5,6,4], k=2 → 5`,
        marks: 20,
        difficulty: 'medium',
        group: 'Sorting and Searching',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `nums = list(map(int, input().split()))\nk = int(input())\nnums.sort(reverse=True)\nprint(nums[k-1])` },
          { language: 'javascript', version: '*', code: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = lines[0].split(' ').map(Number).sort((a,b) => b-a);\nconsole.log(nums[Number(lines[1])-1]);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nums = Arrays.stream(sc.nextLine().split(" ")).mapToInt(Integer::parseInt).toArray();\n        int k = sc.nextInt();\n        Arrays.sort(nums);\n        System.out.println(nums[nums.length - k]);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; getline(cin, line);\n    vector<int> v; int x;\n    istringstream ss(line); while(ss>>x) v.push_back(x);\n    int k; cin >> k;\n    sort(v.rbegin(), v.rend());\n    cout << v[k-1];\n}` },
        ],
        testCases: [
          { input: '3 2 1 5 6 4\n2', expectedOutput: '5', isHidden: false, points: 3 },
          { input: '3 2 3 1 2 4 5 5 6\n4', expectedOutput: '4', isHidden: false, points: 3 },
          { input: '1\n1', expectedOutput: '1', isHidden: true, points: 5 },
          { input: '7 10 4 3 20 15\n3', expectedOutput: '10', isHidden: true, points: 5 },
        ],
      },
    ],
  },
  {
    name: 'Trees and Graphs',
    description: 'Tree traversal and graph algorithms',
    questions: [
      {
        type: 'coding',
        title: 'Maximum Depth of Binary Tree',
        statement: `## Maximum Depth of Binary Tree\n\nGiven a binary tree represented as an array (level-order), find its maximum depth.\n\nThe tree is given in level-order: -1 means null node.\n\n### Input\nSpace-separated integers (level-order, -1 for null)\n\n### Examples\n- Input: \`3 9 20 -1 -1 15 7\` → Output: \`3\``,
        marks: 20,
        difficulty: 'medium',
        group: 'Trees and Graphs',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `from collections import deque\nnodes = list(map(int, input().split()))\nif not nodes or nodes[0] == -1:\n    print(0)\nelse:\n    depth = 0\n    q = deque([0])\n    while q:\n        depth += 1\n        for _ in range(len(q)):\n            i = q.popleft()\n            left = 2 * i + 1\n            right = 2 * i + 2\n            if left < len(nodes) and nodes[left] != -1: q.append(left)\n            if right < len(nodes) and nodes[right] != -1: q.append(right)\n    print(depth)` },
          { language: 'javascript', version: '*', code: `const nodes = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\nif (!nodes.length || nodes[0] === -1) { console.log(0); process.exit(); }\nlet depth = 0, q = [0];\nwhile (q.length) {\n  depth++; const next = [];\n  for (const i of q) {\n    const l = 2*i+1, r = 2*i+2;\n    if (l < nodes.length && nodes[l] !== -1) next.push(l);\n    if (r < nodes.length && nodes[r] !== -1) next.push(r);\n  }\n  q = next;\n}\nconsole.log(depth);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nodes = Arrays.stream(sc.nextLine().split(" ")).mapToInt(Integer::parseInt).toArray();\n        if (nodes.length == 0 || nodes[0] == -1) { System.out.println(0); return; }\n        Queue<Integer> q = new LinkedList<>(); q.add(0); int depth = 0;\n        while (!q.isEmpty()) { depth++; int sz = q.size();\n            for (int k = 0; k < sz; k++) {\n                int i = q.poll();\n                int l = 2*i+1, r = 2*i+2;\n                if (l < nodes.length && nodes[l] != -1) q.add(l);\n                if (r < nodes.length && nodes[r] != -1) q.add(r);\n            }\n        }\n        System.out.println(depth);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <queue>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; getline(cin, line);\n    vector<int> nodes; int x; istringstream ss(line);\n    while(ss>>x) nodes.push_back(x);\n    if(nodes.empty()||nodes[0]==-1){cout<<0;return 0;}\n    queue<int> q; q.push(0); int depth=0;\n    while(!q.empty()){\n        depth++; int sz=q.size();\n        for(int k=0;k<sz;k++){\n            int i=q.front();q.pop();\n            int l=2*i+1,r=2*i+2;\n            if(l<nodes.size()&&nodes[l]!=-1)q.push(l);\n            if(r<nodes.size()&&nodes[r]!=-1)q.push(r);\n        }\n    }\n    cout<<depth;\n}` },
        ],
        testCases: [
          { input: '3 9 20 -1 -1 15 7', expectedOutput: '3', isHidden: false, points: 3 },
          { input: '1 -1 2', expectedOutput: '2', isHidden: false, points: 3 },
          { input: '1', expectedOutput: '1', isHidden: true, points: 5 },
          { input: '1 2 3 4 5 6 7', expectedOutput: '3', isHidden: true, points: 5 },
        ],
      },
      {
        type: 'coding',
        title: 'Number of Islands',
        statement: `## Number of Islands\n\nGiven an m x n grid of '1' (land) and '0' (water), count the number of islands.\n\n### Input\n- Line 1: m n (grid dimensions)\n- Lines 2..m+1: each line contains n space-separated values (0 or 1)\n\n### Examples\n\`\`\`\n4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0\n\`\`\`\nOutput: \`1\``,
        marks: 30,
        difficulty: 'hard',
        group: 'Trees and Graphs',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `import sys\nfrom collections import deque\nlines = sys.stdin.read().split('\\n')\nm, n = map(int, lines[0].split())\ngrid = []\nfor i in range(1, m+1):\n    grid.append(list(map(int, lines[i].split())))\n\ndef bfs(r, c):\n    q = deque([(r, c)])\n    grid[r][c] = 0\n    while q:\n        row, col = q.popleft()\n        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:\n            nr, nc = row+dr, col+dc\n            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == 1:\n                grid[nr][nc] = 0\n                q.append((nr, nc))\n\ncount = 0\nfor r in range(m):\n    for c in range(n):\n        if grid[r][c] == 1:\n            bfs(r, c); count += 1\nprint(count)` },
          { language: 'javascript', version: '*', code: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst [m, n] = lines[0].split(' ').map(Number);\nconst grid = lines.slice(1, m+1).map(l => l.split(' ').map(Number));\nfunction bfs(r, c) {\n  const q = [[r,c]]; grid[r][c] = 0;\n  while (q.length) {\n    const [row, col] = q.shift();\n    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {\n      const nr = row+dr, nc = col+dc;\n      if (nr>=0 && nr<m && nc>=0 && nc<n && grid[nr][nc]===1) { grid[nr][nc]=0; q.push([nr,nc]); }\n    }\n  }\n}\nlet count = 0;\nfor (let r=0;r<m;r++) for (let c=0;c<n;c++) if(grid[r][c]===1){bfs(r,c);count++;}\nconsole.log(count);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    static int[][] grid; static int m, n;\n    static void bfs(int r, int c) {\n        Queue<int[]> q = new LinkedList<>(); q.add(new int[]{r,c}); grid[r][c]=0;\n        int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};\n        while(!q.isEmpty()){ int[] cur=q.poll();\n            for(int[] d:dirs){ int nr=cur[0]+d[0],nc=cur[1]+d[1];\n                if(nr>=0&&nr<m&&nc>=0&&nc<n&&grid[nr][nc]==1){grid[nr][nc]=0;q.add(new int[]{nr,nc});}\n            }\n        }\n    }\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        m=sc.nextInt();n=sc.nextInt();grid=new int[m][n];\n        for(int r=0;r<m;r++) for(int c=0;c<n;c++) grid[r][c]=sc.nextInt();\n        int count=0;\n        for(int r=0;r<m;r++) for(int c=0;c<n;c++) if(grid[r][c]==1){bfs(r,c);count++;}\n        System.out.println(count);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint m,n;\nvector<vector<int>> grid;\nvoid bfs(int r,int c){\n    queue<pair<int,int>> q; q.push({r,c}); grid[r][c]=0;\n    int dr[]={-1,1,0,0},dc[]={0,0,-1,1};\n    while(!q.empty()){ auto[row,col]=q.front();q.pop();\n        for(int d=0;d<4;d++){int nr=row+dr[d],nc=col+dc[d];\n            if(nr>=0&&nr<m&&nc>=0&&nc<n&&grid[nr][nc]==1){grid[nr][nc]=0;q.push({nr,nc});}\n        }\n    }\n}\nint main(){\n    cin>>m>>n; grid.assign(m,vector<int>(n));\n    for(int r=0;r<m;r++) for(int c=0;c<n;c++) cin>>grid[r][c];\n    int count=0;\n    for(int r=0;r<m;r++) for(int c=0;c<n;c++) if(grid[r][c]==1){bfs(r,c);count++;}\n    cout<<count;\n}` },
        ],
        testCases: [
          { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expectedOutput: '1', isHidden: false, points: 4 },
          { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expectedOutput: '3', isHidden: false, points: 4 },
          { input: '1 1\n1', expectedOutput: '1', isHidden: true, points: 6 },
          { input: '2 2\n0 0\n0 0', expectedOutput: '0', isHidden: true, points: 6 },
        ],
      },
      {
        type: 'coding',
        title: 'Shortest Path (BFS)',
        statement: `## Shortest Path\n\nGiven an unweighted undirected graph, find the shortest path from source to destination.\n\n### Input\n- Line 1: V E (vertices, edges)\n- Lines 2..E+1: u v (edge between u and v, 0-indexed)\n- Line E+2: src dest\n\n### Output\nMinimum hops (edges). If no path exists, print -1.`,
        marks: 30,
        difficulty: 'hard',
        group: 'Trees and Graphs',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `from collections import deque, defaultdict\nimport sys\nlines = sys.stdin.read().split()\nidx = 0\nV, E = int(lines[idx]), int(lines[idx+1]); idx += 2\ngraph = defaultdict(list)\nfor _ in range(E):\n    u, v = int(lines[idx]), int(lines[idx+1]); idx += 2\n    graph[u].append(v); graph[v].append(u)\nsrc, dest = int(lines[idx]), int(lines[idx+1])\nif src == dest: print(0)\nelse:\n    dist = [-1] * V; dist[src] = 0\n    q = deque([src])\n    while q:\n        node = q.popleft()\n        for nb in graph[node]:\n            if dist[nb] == -1:\n                dist[nb] = dist[node] + 1\n                if nb == dest: print(dist[nb]); exit()\n                q.append(nb)\n    print(dist[dest])` },
          { language: 'javascript', version: '*', code: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);\nlet idx = 0;\nconst V=nums[idx++], E=nums[idx++];\nconst g = Array.from({length:V},()=>[]);\nfor(let i=0;i<E;i++){const u=nums[idx++],v=nums[idx++];g[u].push(v);g[v].push(u);}\nconst src=nums[idx++],dest=nums[idx++];\nif(src===dest){console.log(0);process.exit();}\nconst dist=Array(V).fill(-1);dist[src]=0;\nconst q=[src];\nwhile(q.length){const node=q.shift();for(const nb of g[node]){if(dist[nb]===-1){dist[nb]=dist[node]+1;if(nb===dest){console.log(dist[nb]);process.exit();}q.push(nb);}}}\nconsole.log(dist[dest]);` },
          { language: 'java', version: '*', code: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int V=sc.nextInt(),E=sc.nextInt();\n        List<List<Integer>> g=new ArrayList<>();\n        for(int i=0;i<V;i++) g.add(new ArrayList<>());\n        for(int i=0;i<E;i++){int u=sc.nextInt(),v=sc.nextInt();g.get(u).add(v);g.get(v).add(u);}\n        int src=sc.nextInt(),dest=sc.nextInt();\n        int[] dist=new int[V]; Arrays.fill(dist,-1); dist[src]=0;\n        Queue<Integer> q=new LinkedList<>(); q.add(src);\n        while(!q.isEmpty()){int node=q.poll();for(int nb:g.get(node)){if(dist[nb]==-1){dist[nb]=dist[node]+1;if(nb==dest){System.out.println(dist[nb]);return;}q.add(nb);}}}\n        System.out.println(dist[dest]);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\n#include <vector>\n#include <queue>\n#include <cstring>\nusing namespace std;\nint main(){\n    int V,E; cin>>V>>E;\n    vector<vector<int>> g(V);\n    for(int i=0;i<E;i++){int u,v;cin>>u>>v;g[u].push_back(v);g[v].push_back(u);}\n    int src,dest; cin>>src>>dest;\n    vector<int> dist(V,-1); dist[src]=0;\n    queue<int> q; q.push(src);\n    while(!q.empty()){int node=q.front();q.pop();for(int nb:g[node]){if(dist[nb]==-1){dist[nb]=dist[node]+1;if(nb==dest){cout<<dist[nb];return 0;}q.push(nb);}}}\n    cout<<dist[dest];\n}` },
        ],
        testCases: [
          { input: '5 4\n0 1\n1 2\n2 3\n3 4\n0 4', expectedOutput: '4', isHidden: false, points: 5 },
          { input: '4 4\n0 1\n0 2\n1 3\n2 3\n0 3', expectedOutput: '2', isHidden: false, points: 5 },
          { input: '2 0\n0 1', expectedOutput: '-1', isHidden: true, points: 8 },
          { input: '1 0\n0 0', expectedOutput: '0', isHidden: true, points: 8 },
        ],
      },
    ],
  },
  {
    name: 'Odd/Even',
    description: 'Basic number theory and parity problems',
    questions: [
      {
        type: 'coding',
        title: 'Odd or Even',
        statement: `## Odd or Even\n\nGiven an integer, print "Odd" if it's odd, "Even" if it's even.\n\n### Examples\n- Input: \`4\` → Output: \`Even\`\n- Input: \`7\` → Output: \`Odd\``,
        marks: 5,
        difficulty: 'easy',
        group: 'Odd/Even',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `n = int(input())\n# Write your code here\n` },
          { language: 'javascript', version: '*', code: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n// Write your code here\n` },
          { language: 'java', version: '*', code: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        // Write your code here\n    }\n    return 0;\n}` },
        ],
        testCases: [
          { input: '4', expectedOutput: 'Even', isHidden: false, points: 1 },
          { input: '7', expectedOutput: 'Odd', isHidden: false, points: 1 },
          { input: '0', expectedOutput: 'Even', isHidden: true, points: 1 },
          { input: '-3', expectedOutput: 'Odd', isHidden: true, points: 1 },
        ],
      },
      {
        type: 'coding',
        title: 'FizzBuzz',
        statement: `## FizzBuzz\n\nGiven n, print numbers from 1 to n. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".\n\n### Input\nA single integer n\n\n### Output\nOne number/word per line.`,
        marks: 10,
        difficulty: 'easy',
        group: 'Odd/Even',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `n = int(input())\nfor i in range(1, n+1):\n    if i % 15 == 0: print("FizzBuzz")\n    elif i % 3 == 0: print("Fizz")\n    elif i % 5 == 0: print("Buzz")\n    else: print(i)` },
          { language: 'javascript', version: '*', code: `const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\nfor(let i=1;i<=n;i++){\n  if(i%15===0) console.log('FizzBuzz');\n  else if(i%3===0) console.log('Fizz');\n  else if(i%5===0) console.log('Buzz');\n  else console.log(i);\n}` },
          { language: 'java', version: '*', code: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args){\n        int n=new Scanner(System.in).nextInt();\n        for(int i=1;i<=n;i++){\n            if(i%15==0) System.out.println("FizzBuzz");\n            else if(i%3==0) System.out.println("Fizz");\n            else if(i%5==0) System.out.println("Buzz");\n            else System.out.println(i);\n        }\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    for(int i=1;i<=n;i++){\n        if(i%15==0) cout<<"FizzBuzz\\n";\n        else if(i%3==0) cout<<"Fizz\\n";\n        else if(i%5==0) cout<<"Buzz\\n";\n        else cout<<i<<"\\n";\n    }\n}` },
        ],
        testCases: [
          { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false, points: 2 },
          { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: false, points: 2 },
          { input: '1', expectedOutput: '1', isHidden: true, points: 3 },
          { input: '20', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz', isHidden: true, points: 3 },
        ],
      },
      {
        type: 'coding',
        title: 'Count Even Numbers in Range',
        statement: `## Count Even Numbers in Range\n\nGiven two integers L and R (inclusive), count how many even numbers are in [L, R].\n\n### Input\nTwo space-separated integers L R\n\n### Examples\n- Input: \`1 10\` → Output: \`5\`\n- Input: \`2 5\` → Output: \`2\``,
        marks: 10,
        difficulty: 'easy',
        group: 'Odd/Even',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `L, R = map(int, input().split())\nprint((R // 2) - ((L - 1) // 2))` },
          { language: 'javascript', version: '*', code: `const [L, R] = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\nconsole.log(Math.floor(R/2) - Math.floor((L-1)/2));` },
          { language: 'java', version: '*', code: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        int L=sc.nextInt(),R=sc.nextInt();\n        System.out.println(R/2 - (L-1)/2);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\nusing namespace std;\nint main(){\n    int L,R; cin>>L>>R;\n    cout<<R/2-(L-1)/2;\n}` },
        ],
        testCases: [
          { input: '1 10', expectedOutput: '5', isHidden: false, points: 2 },
          { input: '2 5', expectedOutput: '2', isHidden: false, points: 2 },
          { input: '0 0', expectedOutput: '1', isHidden: true, points: 3 },
          { input: '-5 5', expectedOutput: '6', isHidden: true, points: 3 },
        ],
      },
      {
        type: 'coding',
        title: 'Sum of Odd Numbers in Range',
        statement: `## Sum of Odd Numbers in Range\n\nGiven L and R, find the sum of all odd numbers in [L, R].\n\n### Input\nTwo space-separated integers L R\n\n### Examples\n- Input: \`1 5\` → Output: \`9\` (1+3+5)`,
        marks: 15,
        difficulty: 'medium',
        group: 'Odd/Even',
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
        starterCode: [
          { language: 'python', version: '*', code: `L, R = map(int, input().split())\n# Find first odd >= L\nstart = L if L % 2 != 0 else L + 1\nif start > R:\n    print(0)\nelse:\n    # Arithmetic series of odds\n    count = (R - start) // 2 + 1\n    print(count * (start + start + (count-1)*2) // 2)` },
          { language: 'javascript', version: '*', code: `const [L, R] = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\nlet sum = 0;\nfor (let i = L; i <= R; i++) { if (i % 2 !== 0) sum += i; }\nconsole.log(sum);` },
          { language: 'java', version: '*', code: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        long L=sc.nextLong(),R=sc.nextLong(),sum=0;\n        for(long i=L;i<=R;i++) if(i%2!=0) sum+=i;\n        System.out.println(sum);\n    }\n}` },
          { language: 'cpp', version: '*', code: `#include <iostream>\nusing namespace std;\nint main(){\n    long long L,R,sum=0;\n    cin>>L>>R;\n    for(long long i=L;i<=R;i++) if(i%2!=0) sum+=i;\n    cout<<sum;\n}` },
        ],
        testCases: [
          { input: '1 5', expectedOutput: '9', isHidden: false, points: 3 },
          { input: '2 8', expectedOutput: '15', isHidden: false, points: 3 },
          { input: '0 0', expectedOutput: '0', isHidden: true, points: 5 },
          { input: '-3 3', expectedOutput: '0', isHidden: true, points: 5 },
        ],
      },
    ],
  },
];

async function main() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB');

  for (const bankData of BANKS) {
    const { name, description, questions: questionDefs } = bankData;

    // Clear existing questions for this bank to reseed cleanly
    await Question.deleteMany({ group: name });

    // Create questions
    const questionDocs = await Question.insertMany(
      questionDefs.map((q) => ({ ...q, group: name }))
    );

    // Upsert the question bank
    await QuestionBank.findOneAndUpdate(
      { name },
      { name, description, questions: questionDocs.map((q) => q._id) },
      { upsert: true, new: true }
    );

    console.log(`✓ Seeded bank: "${name}" with ${questionDocs.length} questions`);
  }

  console.log('\n✅ All question banks seeded!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
