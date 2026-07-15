import urllib.request, json

req = urllib.request.Request('https://api.github.com/repos/Priyachaubey/Microtechnique-Payroll/actions/runs', headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req)
data = json.loads(res.read())
run_id = data['workflow_runs'][0]['id']
print(f'Run ID: {run_id}')

req2 = urllib.request.Request(f'https://api.github.com/repos/Priyachaubey/Microtechnique-Payroll/actions/runs/{run_id}/jobs', headers={'User-Agent': 'Mozilla/5.0'})
res2 = urllib.request.urlopen(req2)
jobs = json.loads(res2.read())['jobs']
failed_job = next((j for j in jobs if j['conclusion'] == 'failure'), None)

if failed_job:
    print(f'Failed Job: {failed_job["name"]} - {failed_job["html_url"]}')
    
    # Fetch logs for the failed job
    req3 = urllib.request.Request(f'https://api.github.com/repos/Priyachaubey/Microtechnique-Payroll/actions/jobs/{failed_job["id"]}/logs', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        res3 = urllib.request.urlopen(req3)
        logs = res3.read().decode('utf-8')
        print("\n--- Logs ---")
        lines = logs.split('\n')
        # Print last 50 lines
        for line in lines[-50:]:
            print(line)
    except Exception as e:
        print(f"Could not fetch logs: {e}")
else:
    print("No failed jobs found.")
