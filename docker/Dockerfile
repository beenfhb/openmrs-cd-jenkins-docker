FROM jenkins/jenkins:2.104
MAINTAINER Mekom Solutions <support@mekomsolutions.com> 

USER root

RUN apt-get update
RUN apt-get -y install nano
RUN apt-get -y install openssh-server

# These packages are needed for Jenkins to build some projects.
# This is because the Jenkins server is used as its own agent. Build tasks are running directly on it.
RUN apt-get -y install ruby-full
RUN apt-get -y install ruby-compass
RUN apt-get -y install xvfb
RUN apt-get -y install firefox-esr
RUN apt-get -y install sudo

# Installing Node.js
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN sudo apt-get install -y nodejs

# Jenkins needs to be a sudo to execute some build tasks (particularly Bahmni Apps)
RUN echo "jenkins ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Provide access to the /usr/share/jenkins directory
RUN chown -R jenkins /usr/share/jenkins

USER jenkins

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

COPY ./resources/security.groovy /usr/share/jenkins/init.groovy.d/security.groovy

COPY ./config/plugins.txt /usr/share/jenkins/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/plugins.txt

COPY ./resources/artifact_repo.js /usr/share/jenkins/artifact_repo.js
COPY ./config/artifact_repo_default.json /usr/share/jenkins/artifact_repo_default.json
COPY ./resources/package.json /usr/share/jenkins/package.json
COPY ./resources/m2_settings.xml.template /usr/share/jenkins/m2_settings.xml.template
COPY ./config/artifact_types.json /usr/share/jenkins/artifact_types.json
COPY ./config/webhook_triggers.json /usr/share/jenkins/webhook_triggers.json