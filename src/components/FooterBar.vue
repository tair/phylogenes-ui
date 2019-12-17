<template>
    <footer class="footer top-bar">
        <div class="container-fluid p-0">
            <span class="p-3">Note: This site has been tested with Chrome. Some pages may not work as expected if you are using <a href="https://conf.arabidopsis.org/display/PHGSUP/Data+panel#Datapanel-Knownissue">other browsers</a>.</span>

            <span class="float-right">
                <a href="http://www.phoenixbioinformatics.org/"><img src="../../src/assets/img/pb-logo.png" alt="" height="35px" class="mr-5"></a>
                <a href="https://www.usc.edu/"><img src="../../src/assets/img/usc-logo.png" alt="" height="35px" class="mr-5"></a>
                <a href="https://www.nsf.gov/"><img src="../../src/assets/img/nsf-logo.png" alt="" height="35px;" class="mr-5"></a>
            </span>
        </div>
    </footer>
</template>

<script>
    export default {
        name: "FooterBar"
    }
</script>

<style scoped>
    .top-bar {
        border-top: 1px solid #dddddd;
    }
</style>
