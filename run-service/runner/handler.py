import json
import sys
import io
import os
import subprocess
import psutil
import time

# used for redirecting outputs on stdout to another stream
from contextlib import redirect_stdout

# STDOUT redirection reused from: https://stackoverflow.com/questions/16571150/how-to-capture-stdout-output-from-a-python-function-call
sys.path.append('/tmp')
os.chdir('/tmp')

PERMITTED_LANGUAGES = set(["python", "cpp"])

# reused function from https://www.geeksforgeeks.org/monitoring-memory-usage-of-a-running-python-program/
def profile_function(function) -> tuple[dict, float, float]:
    """
    Profiles the function to execute by computing the memory and runtime usage

    Args:
        function:       Function to execute
    """

    def wrapper(*args, **kwargs):
        # get the initial memory usage and runtime
        process = psutil.Process(os.getpid())
        memory_data = process.memory_info().rss
        start_time = time.time()

        # execute the function
        results = function(*args, **kwargs)


        process_after = psutil.Process(os.getpid())
        memory_data_after = process_after.memory_info().rss
        end_time = time.time()

        return results, \
            round((memory_data_after - memory_data) / (10 ** 6), 2), \
            round((end_time - start_time) * 1000, 2) 
    
    return wrapper

class Executor:
    PERMITTED_LANGUAGES = set(["python", "cpp"])

    def __init__(self, code, language):
        self.out_channel = io.StringIO()
        self.language = language.strip().lower()
        self.code = code

    @staticmethod
    def __write_to_file(code, filename):
        """
        Writes the input string into a code file.

        Params:
            code (string): String representing the code to write
            filename (string): Name of the file to write the code string into
        """
        
        with open(filename, 'w') as f:
            for line in code.split("\n"):
                f.write(line)
                f.write("\n")

    @profile_function
    def process_python(self):
        Executor.__write_to_file(self.code, "script.py")

        try:
            from script import Solution

            with redirect_stdout(self.out_channel):
                soln = Solution().main()

            return {
                'statusCode': 200,
                'description': 'Success',
                'results': [soln],
                'prints': [self.out_channel.getvalue()] if len(self.out_channel.getvalue()) > 0 else [],
                'errors': []
            }
        except ImportError as ex:
            return {
                'statusCode': 400,
                'description': 'Import Error',
                'results': [],
                'prints': [self.out_channel.getvalue()] if len(self.out_channel.getvalue()) > 0 else [],
                'errors': [str(ex)]
            }
        except Exception as ex:
            return {
                'statusCode': 400,
                'description': 'Runtime Error',
                'results': [],
                'prints': [self.out_channel.getvalue()] if len(self.out_channel.getvalue()) > 0 else [],
                'errors': [str(ex)]
            }

    @profile_function
    def process_cpp(self):
        Executor.__write_to_file(self.code, "script.cpp")
        
        results = subprocess.run(['g++', 'script.cpp'], capture_output=True, text=True)
        if results.returncode != 0:
            return {
                'statusCode': 400,
                'description': 'Compilation or Runtime Error',
                'results': [results.stdout],
                'prints': [results.stdout],
                'errors': [results.stderr]
            }
        else:
            results = subprocess.run(['./a.out'], capture_output=True, text=True)
            return {
                'statusCode': 200 if not results.stderr else 400,
                'description': 'Success' if not results.stderr else "Runtime Error",
                'results': [results.stdout],
                'prints': [results.stdout],
                'errors': [results.stderr]
            }

    def dispatch(self):
        if self.language == "python":
            results, memory, runtime =  self.process_python()
            results["time"] = runtime
            results["memory"] = memory

            return results
        elif self.language == "cpp":
            results, memory, runtime = self.process_cpp()
            results["time"] = runtime
            results["memory"] = memory

            return results
        else:
            raise Exception("Unknown Language")


def handler(event, context):
    """
    Entrypoint of the lambda function

    Args:
        event:          Event object from AWS
        context:        Context object from AWS
    """
    
    if "language" not in event:
        return {
            'statusCode': 403,
            'description': 'No Code Language Specified',
            'results': [],
            'prints': [],
            'errors': ["Missing langauge parameter"],
            "time": 0,
            "memory": 0
        }

    code_language = event["language"].strip().lower()

    if code_language not in PERMITTED_LANGUAGES:
        return {
            'statusCode': 403,
            'description': 'Invalid Code Language Specified',
            'results': [],
            'prints': [],
            'errors': ["Invalid langauge parameter"],
            "time": 0,
            "memory": 0
        } 

    if "code" not in event:
        return {
            'statusCode': 403,
            'description': 'No Code Specified',
            'results': [],
            'prints': [],
            'errors': ["Missing code parameter"],
            "time": 0,
            "memory": 0
        }

    return Executor(event["code"], code_language).dispatch()
