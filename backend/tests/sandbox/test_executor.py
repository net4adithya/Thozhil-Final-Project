# tests/sandbox/test_executor.py
"""
Integration tests for the Docker executor.

All tests require a live Docker daemon and are skipped automatically
when Docker is unavailable. These tests pull real images and run real code.

Run with:
    cd python_backend
    pytest ../tests/sandbox/test_executor.py -v -s --timeout=120
"""

import sys
import os
import asyncio
import pytest

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "python_backend"))

from conftest import skip_no_docker
from app.sandbox.languages import resolve_language
from app.sandbox.executor import execute_in_sandbox
from app.sandbox.schemas import Verdict


# ─── Python ──────────────────────────────────────────────────────────────────

@skip_no_docker
def test_python_hello_world():
    spec = resolve_language("python")
    result = asyncio.run(execute_in_sandbox(spec, 'print("Hello, World!")'))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, World!" in result.stdout
    assert result.exit_code == 0


@skip_no_docker
def test_python_stdin():
    spec = resolve_language("python")
    code = "name = input()\nprint(f'Hello, {name}!')"
    result = asyncio.run(execute_in_sandbox(spec, code, stdin="Alice"))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, Alice!" in result.stdout


@skip_no_docker
def test_python_runtime_error():
    spec = resolve_language("python")
    code = "raise ValueError('oops')"
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.RUNTIME_ERROR
    assert result.exit_code != 0
    assert "ValueError" in (result.stderr or "")


@skip_no_docker
def test_python_timeout():
    spec = resolve_language("python")
    code = "while True: pass"
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.TIME_LIMIT_EXCEEDED


@skip_no_docker
def test_python_no_network():
    """Verify network is disabled inside the container."""
    spec = resolve_language("python")
    code = """
import socket
try:
    socket.setdefaulttimeout(2)
    socket.socket().connect(('8.8.8.8', 53))
    print("CONNECTED")
except Exception as e:
    print(f"NO_NETWORK: {e}")
"""
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert "CONNECTED" not in (result.stdout or "")
    assert "NO_NETWORK" in (result.stdout or "") or result.verdict == Verdict.RUNTIME_ERROR


# ─── JavaScript ───────────────────────────────────────────────────────────────

@skip_no_docker
def test_javascript_hello_world():
    spec = resolve_language("javascript")
    result = asyncio.run(execute_in_sandbox(spec, 'console.log("Hello, World!")'))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, World!" in result.stdout


@skip_no_docker
def test_javascript_stdin():
    spec = resolve_language("javascript")
    code = """
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => { console.log(`Hello, ${line}!`); rl.close(); });
"""
    result = asyncio.run(execute_in_sandbox(spec, code, stdin="Bob"))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, Bob!" in result.stdout


@skip_no_docker
def test_javascript_runtime_error():
    spec = resolve_language("javascript")
    code = "throw new Error('boom');"
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.RUNTIME_ERROR


# ─── C++ ──────────────────────────────────────────────────────────────────────

@skip_no_docker
def test_cpp_hello_world():
    spec = resolve_language("cpp")
    code = '#include <iostream>\nusing namespace std;\nint main(){cout<<"Hello, World!"<<endl;return 0;}'
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, World!" in result.stdout


@skip_no_docker
def test_cpp_stdin():
    spec = resolve_language("cpp")
    code = '#include <iostream>\nusing namespace std;\nint main(){string s;cin>>s;cout<<"Hello, "<<s<<"!"<<endl;return 0;}'
    result = asyncio.run(execute_in_sandbox(spec, code, stdin="Carol"))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, Carol!" in result.stdout


@skip_no_docker
def test_cpp_compile_error():
    spec = resolve_language("cpp")
    code = "this is not valid c++ code {"
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.COMPILE_ERROR
    assert result.compile_error


@skip_no_docker
def test_cpp_runtime_error():
    spec = resolve_language("cpp")
    code = '#include <iostream>\nusing namespace std;\nint main(){int* p=nullptr;*p=1;return 0;}'
    result = asyncio.run(execute_in_sandbox(spec, code))
    # Segfault = runtime error (exit code != 0)
    assert result.verdict == Verdict.RUNTIME_ERROR


# ─── Java ─────────────────────────────────────────────────────────────────────

@skip_no_docker
def test_java_hello_world():
    spec = resolve_language("java")
    code = 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, World!" in result.stdout


@skip_no_docker
def test_java_compile_error():
    spec = resolve_language("java")
    code = "this is not java {"
    result = asyncio.run(execute_in_sandbox(spec, code))
    assert result.verdict == Verdict.COMPILE_ERROR


@skip_no_docker
def test_java_stdin():
    spec = resolve_language("java")
    code = """
import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine();
        System.out.println("Hello, " + name + "!");
    }
}
"""
    result = asyncio.run(execute_in_sandbox(spec, code, stdin="Dave"))
    assert result.verdict == Verdict.ACCEPTED
    assert "Hello, Dave!" in result.stdout


# ─── Security ─────────────────────────────────────────────────────────────────

@skip_no_docker
def test_container_cleanup_after_success():
    """Verify no lingering containers after normal execution."""
    import docker
    client = docker.from_env()
    containers_before = {c.id for c in client.containers.list(all=True)}

    spec = resolve_language("python")
    asyncio.run(execute_in_sandbox(spec, 'print("done")'))

    containers_after = {c.id for c in client.containers.list(all=True)}
    new_containers = containers_after - containers_before
    # Sandbox containers should be removed; at most transient setup containers
    # No permanent containers should remain
    assert len(new_containers) == 0, f"Leaked containers: {new_containers}"
    client.close()


@skip_no_docker
def test_invalid_language_never_reaches_docker():
    """Resolve step must reject unknown languages before Docker is touched."""
    from app.sandbox.languages import resolve_language
    spec = resolve_language("malicious_image:latest")
    assert spec is None  # must be None — Docker is never called
