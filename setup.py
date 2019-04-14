from setuptools import setup, find_packages
import os


def find_files(root, prune=[]):
    return [os.path.join(root, f) for f in os.listdir(root) if os.path.isfile(
        os.path.join(root, f))]


setup(
    name='tempeng_app',
    description='E-Commerce Template Engine',
    version="0.1.0",
    packages=find_packages(),
    classifiers=[
        'Operating System :: POSIX :: Linux',
        'Programming Language :: Python :: 2.7',
        'Environment :: No Input/Output (Daemon)'],
    install_requires=['aalam-common'],
    data_files=[('resources', find_files("resources")),
                ('resources/dist', find_files("resources/dist"))]
)
