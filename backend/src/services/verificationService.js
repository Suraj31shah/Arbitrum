const User = require('../models/User');
const { Client } = require('@notionhq/client');

async function fetchNotionData(userId, dateStart, dateEnd) {
  const user = await User.findOne({ notionId: userId });
  if (!user || !user.notionAccessToken) {
    throw new Error('Notion user not found or access token missing.');
  }

  const notion = new Client({ auth: user.notionAccessToken });
  
  // Use the search endpoint to find recently modified pages or databases
  const response = await notion.search({
    filter: {
      value: 'page',
      property: 'object'
    },
    sort: {
      direction: 'descending',
      timestamp: 'last_edited_time'
    },
    page_size: 100
  });

  // Filter based on dateStart and dateEnd
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  
  let count = 0;
  for (const page of response.results) {
    const edited = new Date(page.last_edited_time);
    if (edited >= start && edited <= end) {
      count++;
    }
  }

  return `Notion Telemetry: User updated ${count} pages recently.`;
}

async function fetchGoogleFitData(userId, dateStart, dateEnd) {
  const user = await User.findOne({ googleId: userId });
  if (!user || !user.googleAccessToken) {
    throw new Error('Google user not found or access token missing.');
  }

  const startTimeMillis = new Date(dateStart).getTime();
  const endTimeMillis = new Date(dateEnd).getTime();

  const response = await fetch(`https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${user.googleAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.calories.expended" },
        { dataTypeName: "com.google.active_minutes" }
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Fit data: ${response.statusText}`);
  }

  const data = await response.json();
  let totalSteps = 0;
  let totalCalories = 0;
  let totalActiveMinutes = 0;
  
  if (data.bucket) {
    for (const bucket of data.bucket) {
      if (bucket.dataset) {
        for (const dataset of bucket.dataset) {
          if (dataset.point) {
            for (const point of dataset.point) {
              if (point.value && point.value[0]) {
                const val = point.value[0].intVal || point.value[0].fpVal || 0;
                if (dataset.dataSourceId && dataset.dataSourceId.includes("step_count")) {
                  totalSteps += val;
                } else if (dataset.dataSourceId && dataset.dataSourceId.includes("calories")) {
                  totalCalories += val;
                } else if (dataset.dataSourceId && dataset.dataSourceId.includes("active_minutes")) {
                  totalActiveMinutes += val;
                }
              }
            }
          }
        }
      }
    }
  }

  return `Google Health Telemetry: User logged ${totalSteps} steps, ${Math.round(totalCalories)} calories burned, and ${totalActiveMinutes} active minutes recently.`;
}

async function fetchIntegrationData(integrationId, integrationHandle, dateStart, dateEnd) {
  if (!integrationHandle) {
    return `Error: No username or API key provided by the user for ${integrationId}.`;
  }

  try {
    if (integrationId === 'github') {
      return await fetchGitHubData(integrationHandle, dateStart, dateEnd);
    } else if (integrationId === 'leetcode') {
      return await fetchLeetCodeData(integrationHandle);
    } else if (integrationId === 'wakatime') {
      return await fetchWakaTimeData(integrationHandle);
    } else if (integrationId === 'todoist') {
      return await fetchTodoistData(integrationHandle, dateStart, dateEnd);
    } else if (integrationId === 'notion') {
      return await fetchNotionData(integrationHandle, dateStart, dateEnd);
    } else if (integrationId === 'google') {
      return await fetchGoogleFitData(integrationHandle, dateStart, dateEnd);
    }
    return `Telemetry data for ${integrationId} (user: ${integrationHandle})`;
  } catch (error) {
    console.error(`Error fetching ${integrationId} data:`, error.message);
    return `Error fetching telemetry: ${error.message}`;
  }
}

async function fetchTodoistData(todoistId, dateStart, dateEnd) {
  // Find the user to get their access token
  const user = await User.findOne({ todoistId });
  if (!user || !user.todoistAccessToken) {
    throw new Error('Todoist user not found or access token missing.');
  }

  // Use the Todoist REST API v1 to fetch active tasks
  const response = await fetch(`https://api.todoist.com/api/v1/tasks`, {
    headers: {
      'Authorization': `Bearer ${user.todoistAccessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Todoist tasks: ${response.statusText}`);
  }

  const tasks = await response.json();
  const tasksCount = tasks.length || 0;

  return `Todoist Telemetry: User currently has ${tasksCount} active tasks.`;
}

async function fetchGitHubData(username, dateStart, dateEnd) {
  // We use the public events API for the user provided
  const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=50`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) throw new Error('Failed to fetch GitHub events or user not found');
  const events = await response.json();
  
  if (!Array.isArray(events)) {
    throw new Error(events.message || 'Invalid response from GitHub API');
  }
  
  // Basic filtering for Push events (commits)
  const pushEvents = events.filter(e => e.type === 'PushEvent');
  const totalCommits = pushEvents.reduce((acc, event) => {
    const commitsArray = event.payload && event.payload.commits;
    if (commitsArray && commitsArray.length > 0) {
      return acc + commitsArray.length;
    }
    // If GitHub omits the commits array, count it as 1 commit
    return acc + 1;
  }, 0);

  // Filter for Pull Requests opened
  const prEvents = events.filter(e => e.type === 'PullRequestEvent' && e.payload && e.payload.action === 'opened');
  const totalPRs = prEvents.length;

  // Filter for Issues opened
  const issueEvents = events.filter(e => e.type === 'IssuesEvent' && e.payload && e.payload.action === 'opened');
  const totalIssues = issueEvents.length;

  return `GitHub Telemetry for ${username}: Found ${totalCommits} commits, ${totalPRs} pull requests opened, and ${totalIssues} issues opened recently.`;
}

async function fetchLeetCodeData(username) {
  // Using LeetCode GraphQL public endpoint
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } })
  });

  if (!response.ok) throw new Error('Failed to fetch LeetCode data');
  const data = await response.json();
  
  if (data.errors) throw new Error(data.errors[0].message);
  
  const stats = data.data.matchedUser?.submitStats?.acSubmissionNum;
  if (!stats) return `LeetCode Telemetry: User ${username} not found or has no solved problems.`;

  const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
  return `LeetCode Telemetry for ${username}: Total Problems Solved = ${totalSolved}`;
}

async function fetchWakaTimeData(apiKey) {
  // WakaTime API uses basic auth with the API key provided by the user
  const response = await fetch('https://wakatime.com/api/v1/users/current/summaries?range=Today', {
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch WakaTime summaries. Invalid API Key.');
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    return `WakaTime Telemetry: Logged ${data.data[0].grand_total.text} today.`;
  }
  return 'WakaTime Telemetry: No data logged today.';
}

module.exports = {
  fetchIntegrationData
};
