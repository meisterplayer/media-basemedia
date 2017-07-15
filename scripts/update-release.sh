text=`awk '/<a name=/{ if (found_first_name == 1) { stop_print = 1}; } { if (stop_print == 0) { print; }} /<a name=/{ found_first_name = 1; }' < ./CHANGELOG.md | awk '/###/{ can_print = 1; } { if (can_print == 1) { print; }}' | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\\r\\\n/g'`;
data='{"tag_name":"'"${TRAVIS_TAG}"'", "name":"'"$TRAVIS_TAG"'", "body":"'"$text"'"}';

curl -XPOST -H "Authorization: token ${GH_TOKEN}" \
    --data "$data" \
    "https://api.github.com/repos/${TRAVIS_REPO_SLUG}/releases"
