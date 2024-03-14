#!/bin/bash

#
# Set lowcoder api service classpath for use in startup script
#
export LOWCODER_CLASSPATH="`find libs/ dependencies/ app/ -type f -name "*.jar" | tr '\n' ':' | sed -e 's/:$//'`"

#
# Example usage:
#
# java -cp "${LOWCODER_CLASSPATH}" org.lowcoder.api.ServerApplication
